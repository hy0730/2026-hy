/**
 * [안양의 시간] 서비스 워커 (Service Worker) v1.0.4
 * 수정보완 사항: 
 * 1. 개별 파일 캐싱 실패 시 예외 처리 추가 (Atomic Failure 방지)
 * 2. 외부 API(카카오맵 등) 캐싱 제외 로직 추가
 * 3. 제어권 즉시 획득 로직 추가
 */

const CACHE_NAME = 'anyang-time-v1.0.4';

// 캐싱할 자산 목록 (경로를 다시 한번 점검하세요)
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './data/stages.js',
  './stages/stage.html',
  './stages/stage.js',
  './stages/style.css',
  
  // 이미지 자산
  './assets/images/map.png',
  './assets/images/han_1.png',
  './assets/images/yang_1.png',
  './assets/images/%EC%9B%90%EC%8B%9C%EC%9D%B8%201.png', // 원시인 1.png
  './assets/images/certificate.png',
  
  // 유물 이미지 (0~7번)
  './assets/images/relic_0_main.png', './assets/images/relic_0_real.png',
  './assets/images/relic_1_main.png', './assets/images/relic_1_real.png',
  './assets/images/relic_2_main.png', './assets/images/relic_2_real.png',
  './assets/images/relic_3_main.png', './assets/images/relic_3_real.png',
  './assets/images/relic_4_main.png', './assets/images/relic_4_real.png',
  './assets/images/relic_5_main.png', './assets/images/relic_5_real.png',
  './assets/images/relic_6_main.png', './assets/images/relic_6_real.png',
  './assets/images/relic_7_main.png', './assets/images/relic_7_real.png',

  // 도구 이미지
  './assets/images/tool_brush.png',
  './assets/images/tool_scanner.png',

  // 사운드 자산
  './assets/sounds/bgm_main.mp3',
  './assets/sounds/sfx_click.mp3',
  './assets/sounds/sfx_brush.mp3',
  './assets/sounds/sfx_clear.mp3'
];

// 1. Install: 설치 및 리소스 저장
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] 모든 자산을 개별적으로 캐싱 시도합니다.');
      // cache.addAll 대신 개별 캐싱을 시도하여 파일 하나가 없어도 전체가 깨지지 않게 보완
      return Promise.allSettled(
        assetsToCache.map((url) => {
          return cache.add(url).catch((err) => console.warn(`[SW] 캐싱 실패: ${url}`, err));
        })
      );
    })
  );
  self.skipWaiting(); // 업데이트 시 즉시 활성화
});

// 2. Activate: 구버전 캐시 삭제 및 제어권 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 구버전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 활성화 즉시 모든 클라이언트(탭)를 제어
  self.clients.claim();
});

// 3. Fetch: 전략적 응답 (캐시 우선 -> 네트워크)
self.addEventListener('fetch', (event) => {
  // 카카오맵 API나 외부 라이브러리 요청은 캐싱에서 제외 (충돌 방지)
  if (event.request.url.includes('dapi.kakao.com') || event.request.url.includes('google-analytics')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 1. 캐시에 있으면 즉시 반환
      if (response) return response;

      // 2. 캐시에 없으면 네트워크 호출
      return fetch(event.request).then((networkResponse) => {
        // 유효한 응답이 아니면 캐싱하지 않고 반환
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // 새로운 자산은 동적으로 캐시에 추가
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    }).catch(() => {
      // 3. 네트워크 실패 시(오프라인) 대체 페이지
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});