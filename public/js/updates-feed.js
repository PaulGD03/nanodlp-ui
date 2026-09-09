// Updates notification center — popover that renders the Concepts3D news feed
// (https://dashboard.concepts3d.eu/dashboard.html, .update-item entries) as messages.
(function () {
  'use strict';
  var toggle = document.getElementById('updates-toggle');
  var popover = document.getElementById('updates-popover');
  var list = document.getElementById('updates-list');
  if (!toggle || !popover || !list) return;

  var FEED_URL = 'https://dashboard.concepts3d.eu/dashboard.html';
  var loaded = false;

  function truncate(text, max) {
    text = (text || '').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '\u2026';
  }

  function render(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var items = doc.querySelectorAll('.update-item');
    list.textContent = '';
    if (!items.length) {
      var empty = document.createElement('div');
      empty.className = 'c3d-updates-empty';
      empty.textContent = 'No updates';
      list.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var heading = item.querySelector('h2');
      var paragraph = item.querySelector('p');
      var anchor = item.querySelector('a[href]');

      var el = document.createElement('div');
      el.className = 'c3d-updates-item';

      var title = document.createElement('div');
      title.className = 'c3d-updates-item-title';
      title.textContent = heading ? heading.textContent.trim() : '';
      el.appendChild(title);

      var body = document.createElement('div');
      body.className = 'c3d-updates-item-body';
      body.textContent = truncate(paragraph ? paragraph.textContent : '', 180);
      el.appendChild(body);

      if (anchor && anchor.getAttribute('href')) {
        var link = document.createElement('a');
        link.className = 'c3d-updates-item-link';
        link.href = anchor.getAttribute('href');
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Read more';
        el.appendChild(link);
      }
      list.appendChild(el);
    });
  }

  function load() {
    if (loaded) return;
    loaded = true;
    fetch(FEED_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(render)
      .catch(function () {
        list.textContent = '';
        var err = document.createElement('div');
        err.className = 'c3d-updates-empty';
        err.textContent = 'Could not load updates';
        list.appendChild(err);
      });
  }

  function open() {
    load();
    popover.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }
  function close() {
    popover.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    if (popover.hidden) open(); else close();
  });
  document.addEventListener('click', function (e) {
    if (!popover.hidden && !popover.contains(e.target) && !toggle.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !popover.hidden) close();
  });
})();
