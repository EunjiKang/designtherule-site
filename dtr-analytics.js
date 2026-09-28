(() => {
  'use strict';
  const id = 'G-Q693VPMPQK';
  const key = 'dtr-analytics-consent-v1';
  const panel = document.getElementById('analytics-consent');
  const settings = document.getElementById('analytics-settings');
  let choice = null;
  try { choice = localStorage.getItem(key); } catch (_) {}
  let started = false;
  let lastPage = '';
  let previousPage = '';
  let pending = false;
  const disabledKey = 'ga-disable-' + id;
  window[disabledKey] = choice !== 'granted';

  function safeUrl(raw) {
    try { const u = new URL(raw); return u.origin + u.pathname; } catch (_) { return ''; }
  }
  function route() {
    const path = (location.hash.slice(1).split('?')[0] || 'home');
    return '/' + path.replace(/[^a-zA-Z0-9/_-]/g, '');
  }
  function pageView() {
    if (!started || choice !== 'granted') return;
    const path = route();
    if (path === lastPage) return;
    const page = location.origin + path;
    const heading = document.querySelector('.page.active h1');
    window.gtag('config', id, {send_page_view:false, page_location:page, page_referrer:previousPage || safeUrl(document.referrer)});
    window.gtag('event', 'page_view', {
      page_location: page,
      page_path: path,
      page_title: heading ? heading.textContent.trim() + ' — Design the Rule' : document.title,
      page_referrer: previousPage || safeUrl(document.referrer)
    });
    lastPage = path;
    previousPage = page;
  }
  function schedulePageView() {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; pageView(); }, 0);
  }
  function start() {
    if (started || !['designtherule.com', 'www.designtherule.com'].includes(location.hostname)) return;
    started = true;
    window[disabledKey] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + route(),
      page_referrer: safeUrl(document.referrer)
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(tag);
    pageView();
  }
  function choose(value) {
    choice = value;
    try { localStorage.setItem(key, value); } catch (_) {}
    panel.hidden = true;
    if (value === 'granted') { start(); return; }
    window[disabledKey] = true;
    if (started) {
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) return;
        ['', ';domain=' + location.hostname, ';domain=.designtherule.com'].forEach(domain => {
          document.cookie = name + '=;Max-Age=0;path=/' + domain;
        });
      });
      // Reload with analytics disabled to stop all already-loaded tag timers.
      location.reload();
    }
  }
  document.getElementById('analytics-allow').addEventListener('click', () => choose('granted'));
  document.getElementById('analytics-decline').addEventListener('click', () => choose('denied'));
  settings.addEventListener('click', () => {
    panel.hidden = false;
    document.getElementById('analytics-allow').focus();
  });
  ['pushState', 'replaceState'].forEach(method => {
    const original = history[method];
    history[method] = function () {
      const result = original.apply(this, arguments);
      schedulePageView();
      return result;
    };
  });
  window.addEventListener('hashchange', schedulePageView);
  window.addEventListener('popstate', schedulePageView);
  panel.hidden = choice === 'granted' || choice === 'denied';
  if (choice === 'granted') start();
})();
