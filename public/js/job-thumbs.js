/* ============================================================
   Job thumbnails — pre-warm + client-side cache
   ============================================================

   /static/plates/<id>/3d.png is a 1600x960 PNG (~770 KB) served with
   "Cache-Control: no-store, no-cache, must-revalidate, private ... max-age=0",
   so the browser may never reuse it: every /plates list refresh re-downloads
   every render, and each one is decoded at full size (~6 MB RGBA) to be drawn
   into a 58px box (232px while hover-zoomed).

   This module keeps the native <img src> as the loader (so the page still works
   with JS off), then downscales each render once into a cached blob and swaps
   it in. Result: memory drops to a few tens of KB per job, and any later
   refresh of #plates-list is served from the in-page cache with zero requests.

   Cache key is the render URL (it carries ?{{row.Updated}}, so it changes when
   the plate is re-sliced). The key is captured into data-thumb on first sight
   because main.js' .retry loop appends a timestamp to src.
   ============================================================ */
(function () {
	'use strict';

	var MAX_EDGE = 640;        // hover zoom draws the thumb at 232 CSS px (464 @2x)
	var QUALITY = 0.85;
	var MAX_ENTRIES = 400;     // bounded cache; oldest object URLs are revoked
	var CONCURRENCY = 3;       // canvas + encode work in flight at a time

	var SELECTOR = '#plates-list img.threed, #plates-list img.c3d-print-result-thumb';
	var cache = window.jobThumbCache || (window.jobThumbCache = new Map());
	var failed = window.jobThumbFailed || (window.jobThumbFailed = new Set());
	var queue = [];
	var active = 0;

	function sourceOf(img) {
		var stored = img.getAttribute('data-thumb');
		if (stored) return stored;
		var src = img.getAttribute('src') || '';
		if (!src || src.indexOf('blob:') === 0 || src.indexOf('data:') === 0) return '';
		img.setAttribute('data-thumb', src);
		return src;
	}

	function thumbFor(url) {
		return cache.get(url);
	}

	/* A list refresh replaces every row, so queued elements can be detached or
	   re-pointed at a newer render before their load settles. Such an element
	   must not write into the cache. */
	function stale(img, url) {
		return !img.isConnected || sourceOf(img) !== url;
	}

	/* Swap the cached blob into every element that still points at this render. */
	function assign(url, blobUrl) {
		var imgs = document.querySelectorAll(SELECTOR);
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			if (sourceOf(img) !== url) continue;
			if (img.getAttribute('src') !== blobUrl) img.setAttribute('src', blobUrl);
			img.classList.remove('hide', 'retry');
		}
	}

	function evictIfNeeded() {
		while (cache.size > MAX_ENTRIES) {
			var oldestKey = cache.keys().next().value;
			var oldestUrl = cache.get(oldestKey);
			cache.delete(oldestKey);
			if (oldestUrl && oldestUrl.indexOf('blob:') === 0) {
				try { URL.revokeObjectURL(oldestUrl); } catch (e) { /* already gone */ }
			}
		}
	}

	/* Downscale an already-loaded <img> into a cached blob. No extra request. */
	function capture(img, url) {
		if (stale(img, url)) {
			pump();
			return;
		}
		var w = img.naturalWidth, h = img.naturalHeight;
		if (!w || !h) {
			failed.add(url);
			pump();
			return;
		}
		var scale = Math.min(1, MAX_EDGE / Math.max(w, h));
		var cw = Math.max(1, Math.round(w * scale));
		var ch = Math.max(1, Math.round(h * scale));
		var canvas = document.createElement('canvas');
		canvas.width = cw;
		canvas.height = ch;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0, cw, ch);
		var done = false;
		var finish = function (blob) {
			if (done) return;
			done = true;
			if (!blob) {
				failed.add(url);
			} else {
				var blobUrl = URL.createObjectURL(blob);
				cache.set(url, blobUrl);
				evictIfNeeded();
				assign(url, blobUrl);
			}
			pump();
		};
		if (canvas.toBlob) {
			try {
				canvas.toBlob(finish, 'image/webp', QUALITY);
			} catch (e) {
				canvas.toBlob(finish);
			}
		} else {
			finish(null);
		}
	}

	function pump() {
		while (active < CONCURRENCY && queue.length > 0) {
			var item = queue.shift();
			if (stale(item.img, item.url)) continue;
			active++;
			/* Waiting for the element itself keeps a single network request per
			   render: the browser loads it natively, we only post-process. */
			if (item.img.complete) {
				active--;
				capture(item.img, item.url);
			} else {
				(function (img, url) {
					var release = function () {
						img.removeEventListener('load', onLoad);
						img.removeEventListener('error', onError);
					};
					var onLoad = function () {
						release();
						active--;
						capture(img, url);
					};
					var onError = function () {
						release();
						active--;
						failed.add(url);
						pump();
					};
					img.addEventListener('load', onLoad);
					img.addEventListener('error', onError);
				})(item.img, item.url);
			}
		}
	}

	/* Cached thumbs go in immediately; everything else is queued, on-screen
	   first, and off-screen lazy images are switched to eager so they pre-warm. */
	function hydrate() {
		var imgs = document.querySelectorAll(SELECTOR);
		var pending = [];
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			var url = sourceOf(img);
			if (!url || img.getAttribute('src') === '') continue;
			var cached = thumbFor(url);
			if (cached) {
				if (img.getAttribute('src') !== cached) img.setAttribute('src', cached);
				img.classList.remove('hide', 'retry');
				continue;
			}
			if (failed.has(url)) continue;
			if (img.getAttribute('data-thumb-queued') === url) continue;
			img.setAttribute('data-thumb-queued', url);
			if (img.loading === 'lazy') img.loading = 'eager';
			pending.push({ img: img, url: url, top: img.getBoundingClientRect().top });
		}
		if (pending.length === 0) return;
		pending.sort(function (a, b) { return a.top - b.top; });
		queue = queue.concat(pending);
		pump();
	}

	function observe() {
		var root = document.getElementById('plates-list');
		if (!root || !window.MutationObserver) return;
		/* Mutation callbacks are microtasks, i.e. they land before the browser
		   gets a chance to start the images the refresh just inserted, so the
		   cached blobs go in without a network round trip. hydrate() is
		   idempotent and only touches attributes (no childList), so it cannot
		   re-trigger itself. */
		new MutationObserver(function () { hydrate(); })
			.observe(root, { childList: true, subtree: true });
	}

	function start() {
		observe();
		hydrate();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}

	window.jobThumbs = {
		hydrate: hydrate,
		cache: cache,
		failed: failed,
		stats: function () {
			return {
				cached: cache.size,
				failed: failed.size,
				queued: queue.length,
				entries: (function () {
					var out = [];
					cache.forEach(function (v, k) { out.push({ url: k, thumb: v }); });
					return out;
				})()
			};
		}
	};
})();
