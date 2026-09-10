/* ============================================================
   Job thumbnails — pre-warm + persistent client-side cache
   ============================================================

   /static/plates/<id>/3d.png is a 1600x960 PNG (~770 KB) served with
   "Cache-Control: no-store, no-cache, must-revalidate, private ... max-age=0",
   so the browser may never reuse it and every page open re-downloaded every
   render, each decoded at ~6 MB RGBA to be painted into a 58px box (232px while
   hover-zoomed).

   This module owns thumbnail loading for #plates-list:
     L1  in-page Map of url -> objectURL          (instant within a page)
     L2  IndexedDB store of url -> downscaled blob (survives page loads)

   A cached render is painted without any network request, so re-opening the
   jobs page shows thumbnails immediately instead of popping in. Only a miss
   touches the network, once per render; the result is downscaled once
   (640px webp, ~20 KB) and written back to L2.

   The templates therefore render the row preview as data-thumb (no src) when
   the server reports a preview, and keep a plain src for the "render missing"
   case so main.js' existing .retry loop still applies. Thumbnails require JS;
   everything else in the row (name, metrics, actions) does not.
   ============================================================ */
(function () {
	'use strict';

	var MAX_EDGE = 640;             // hover zoom draws the thumb at 232 CSS px (464 @2x)
	var QUALITY = 0.85;
	var MAX_ENTRIES = 400;          // L2 cap; oldest entries are pruned
	var MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
	var CONCURRENCY = 3;            // canvas + encode work in flight

	var SELECTOR = '#plates-list img.threed, #plates-list img.c3d-print-result-thumb';

	var cache = window.jobThumbCache || (window.jobThumbCache = new Map());     // L1
	var failed = window.jobThumbFailed || (window.jobThumbFailed = new Set());
	var resolving = new Set();
	var queue = [];
	var active = 0;
	var puts = 0;

	/* ---------- helpers ---------- */

	function sourceOf(img) {
		var stored = img.getAttribute('data-thumb');
		if (stored) return stored;
		var src = img.getAttribute('src') || '';
		if (!src || src.indexOf('blob:') === 0 || src.indexOf('data:') === 0) return '';
		img.setAttribute('data-thumb', src);
		return src;
	}

	/* A list refresh replaces every row, so queued elements can be detached or
	   re-pointed at a newer render before their load settles. Such an element
	   must not write into the cache. */
	function stale(img, url) {
		return !img.isConnected || sourceOf(img) !== url;
	}

	/* Paint an image only once it can actually draw: until then the slot shows
	   its resting state instead of an empty box (see .c3d-thumb-pending). */
	function markReady(img) {
		img.classList.remove('c3d-thumb-pending');
		img.classList.add('c3d-thumb-ready');
	}

	function show(img, url) {
		/* Only a slot that is still empty may go pending: swapping the src of an
		   image that is already painted (render -> downscaled blob) must not
		   blank it, and must not flash the spinner. */
		var painted = img.complete && img.naturalWidth > 0;
		if (img.getAttribute('src') !== url) {
			if (!painted) {
				img.classList.remove('c3d-thumb-ready');
				img.classList.add('c3d-thumb-pending');
			}
			img.setAttribute('src', url);
		}
		img.classList.remove('hide', 'retry');
		if (img.complete && img.naturalWidth > 0) {
			markReady(img);
			return;
		}
		var settle = function () {
			img.removeEventListener('load', settle);
			img.removeEventListener('error', settle);
			markReady(img);
		};
		img.addEventListener('load', settle);
		img.addEventListener('error', settle);
	}

	/* Swap a known-good url (object URL or render path) into every element
	   still pointing at this render. */
	function assign(url, paintUrl) {
		var imgs = document.querySelectorAll(SELECTOR);
		for (var i = 0; i < imgs.length; i++) {
			if (sourceOf(imgs[i]) === url) show(imgs[i], paintUrl);
		}
	}

	/* Nothing cached: hand the render to the native loader (one request). */
	function fetchNatively(url) {
		var imgs = document.querySelectorAll(SELECTOR);
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			if (sourceOf(img) !== url || img.getAttribute('src')) continue;
			img.loading = 'eager';
			show(img, url);
			enqueue(img, url);
		}
		pump();
	}

	/* ---------- L2: IndexedDB ---------- */

	var dbPromise = null;

	function db() {
		if (dbPromise) return dbPromise;
		dbPromise = new Promise(function (resolve, reject) {
			if (!window.indexedDB) {
				reject(new Error('indexedDB unavailable'));
				return;
			}
			var req = indexedDB.open('nanodlp-job-thumbs', 1);
			req.onupgradeneeded = function () {
				var d = req.result;
				var store = d.objectStoreNames.contains('thumbs')
					? req.transaction.objectStore('thumbs')
					: d.createObjectStore('thumbs', { keyPath: 'url' });
				if (!store.indexNames.contains('at')) store.createIndex('at', 'at');
			};
			req.onsuccess = function () { resolve(req.result); };
			req.onerror = function () { reject(req.error); };
		});
		return dbPromise;
	}

	function idbGet(url) {
		return db().then(function (d) {
			return new Promise(function (resolve) {
				var req = d.transaction('thumbs', 'readonly').objectStore('thumbs').get(url);
				req.onsuccess = function () {
					var rec = req.result;
					resolve(rec && rec.blob ? rec.blob : null);
				};
				req.onerror = function () { resolve(null); };
			});
		}).catch(function () { return null; });
	}

	function idbPut(url, blob) {
		db().then(function (d) {
			var tx = d.transaction('thumbs', 'readwrite');
			tx.objectStore('thumbs').put({ url: url, blob: blob, at: Date.now() });
			tx.oncomplete = function () {
				if (++puts % 20 === 1) idbPrune();
			};
		}).catch(function () { /* private mode / quota: L1 still works */ });
	}

	function idbPrune() {
		db().then(function (d) {
			var counted = d.transaction('thumbs', 'readonly').objectStore('thumbs').count();
			counted.onsuccess = function (e) {
				var total = e.target.result;
				if (total <= MAX_ENTRIES) return;
				var cutoff = Date.now() - MAX_AGE_MS;
				var seen = 0;
				var store = d.transaction('thumbs', 'readwrite').objectStore('thumbs');
				store.index('at').openCursor().onsuccess = function (ev) {
					var cursor = ev.target.result;
					if (!cursor) return;
					seen++;
					if (seen <= total - MAX_ENTRIES || cursor.value.at < cutoff) cursor.delete();
					cursor.continue();
				};
			};
		}).catch(function () {});
	}

	/* ---------- capture ---------- */

	function evictL1() {
		while (cache.size > MAX_ENTRIES) {
			var key = cache.keys().next().value;
			var url = cache.get(key);
			cache.delete(key);
			if (url && url.indexOf('blob:') === 0) {
				try { URL.revokeObjectURL(url); } catch (e) { /* already gone */ }
			}
		}
	}

	/* Downscale an already-loaded <img> into L1 + L2. No extra request. */
	function capture(img, url) {
		if (stale(img, url)) { pump(); return; }
		var w = img.naturalWidth, h = img.naturalHeight;
		if (!w || !h) { failed.add(url); pump(); return; }
		var scale = Math.min(1, MAX_EDGE / Math.max(w, h));
		var cw = Math.max(1, Math.round(w * scale));
		var ch = Math.max(1, Math.round(h * scale));
		var canvas = document.createElement('canvas');
		canvas.width = cw;
		canvas.height = ch;
		canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
		var done = false;
		var finish = function (blob) {
			if (done) return;
			done = true;
			if (!blob) {
				failed.add(url);
			} else {
				var objectUrl = URL.createObjectURL(blob);
				cache.set(url, objectUrl);
				evictL1();
				assign(url, objectUrl);
				idbPut(url, blob);
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

	function enqueue(img, url) {
		if (img.getAttribute('data-thumb-queued') === url) return;
		img.setAttribute('data-thumb-queued', url);
		queue.push({ img: img, url: url, top: img.getBoundingClientRect().top });
	}

	function pump() {
		while (active < CONCURRENCY && queue.length > 0) {
			var item = queue.shift();
			if (stale(item.img, item.url)) continue;
			active++;
			if (item.img.complete && item.img.naturalWidth > 0) {
				active--;
				capture(item.img, item.url);
			} else if (item.img.complete) {
				/* already errored before we looked */
				active--;
				failed.add(item.url);
			} else {
				(function (img, url) {
					var release = function () {
						img.removeEventListener('load', onLoad);
						img.removeEventListener('error', onError);
					};
					var onLoad = function () { release(); active--; capture(img, url); };
					var onError = function () {
						release();
						active--;
						failed.add(url);
						/* no bytes and nothing to show: fall back to the resting slot */
						if (!img.classList.contains('retry')) {
							img.removeAttribute('src');
							img.classList.add('hide');
						}
						markReady(img);
						pump();
					};
					img.addEventListener('load', onLoad);
					img.addEventListener('error', onError);
				})(item.img, item.url);
			}
		}
	}

	/* ---------- hydrate ---------- */

	function resolveThumb(url) {
		if (resolving.has(url)) return;
		resolving.add(url);
		idbGet(url).then(function (blob) {
			resolving.delete(url);
			if (blob) {
				var objectUrl = URL.createObjectURL(blob);
				cache.set(url, objectUrl);
				assign(url, objectUrl);
			} else {
				fetchNatively(url);
			}
		});
	}

	function hydrate() {
		var imgs = document.querySelectorAll(SELECTOR);
		for (var i = 0; i < imgs.length; i++) {
			var img = imgs[i];
			var url = sourceOf(img);
			if (!url) continue;
			var cached = cache.get(url);
			if (cached) {
				show(img, cached);
				continue;
			}
			if (failed.has(url) || resolving.has(url)) continue;
			if (img.getAttribute('src')) {
				/* legacy path (server rendered a src, e.g. the missing-render
				   .retry case): still cache the bytes if it does load */
				enqueue(img, url);
				continue;
			}
			resolveThumb(url);
		}
		pump();
	}

	function observe() {
		var root = document.getElementById('plates-list');
		if (!root || !window.MutationObserver) return;
		/* Mutation callbacks are microtasks: they land before the browser can
		   start anything a refresh inserted, so cached thumbs go in for free.
		   hydrate() only touches attributes, so it cannot re-trigger itself. */
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
			var out = [];
			cache.forEach(function (v, k) { out.push(k); });
			return { cached: cache.size, failed: failed.size, resolving: resolving.size, queued: queue.length, urls: out };
		}
	};
})();
