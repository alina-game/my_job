// 서비스 워커: 홈 화면 앱으로 설치할 수 있게 해 주고, 인터넷이 끊겨도 마지막으로 받은 게임을 열 수 있게 해요.
// 항상 인터넷에서 새 파일을 먼저 받아서(업데이트가 바로 반영됨), 안 될 때만 저장해 둔 파일을 써요.

const CACHE = 'myjob-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./'))),
  );
});
