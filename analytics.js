(() => {
  if (!['tehnika-courses.ru', 'www.tehnika-courses.ru'].includes(location.hostname)) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  fetch('https://api.tehnika-courses.ru/', {
    method: 'POST', headers: {'Content-Type': 'text/plain;charset=UTF-8'},
    body: JSON.stringify({event: 'visit'}), keepalive: true, credentials: 'omit',
    signal: AbortSignal.timeout(8000),
  }).catch(() => {});
})();
