const CACHE_NAME = 'larry-vr-pro-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 오픈 완료');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('Service Worker 활성화 중...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 이벤트 - 네트워크 우선, 실패시 캐시
self.addEventListener('fetch', event => {
  // API 호출은 캐시하지 않음
  if (event.request.url.includes('alphavantage.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공한 응답을 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패시 캐시에서 가져오기
        return caches.match(event.request);
      })
  );
});

// 백그라운드 동기화 (미래 기능)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-prices') {
    console.log('백그라운드 가격 동기화');
  }
});

// 푸시 알림 (미래 기능)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234f46e5" width="100" height="100"/><text y="75" font-size="70" fill="white" text-anchor="middle" x="50">📊</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234f46e5" width="100" height="100"/></svg>',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('라오어 VR Pro', options)
  );
});
