/**
 * ClearCut PWA Service Worker (sw.js)
 * High-performance caching, offline fallback, and PWA installation support
 */

const CACHE_NAME = 'clearcut-pwa-v6';

// Essential App Shell resources to precache
const PRECACHE_ASSETS = [
    './',
    './index.php',
    './manual.php',
    './manifest.json',
    './assets/css/style.css',
    './assets/css/manual.css',
    './assets/js/app.js',
    './assets/js/manual.js',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-192.png',
    './assets/icons/icon-maskable-512.png',
    './assets/icons/icon.svg'
];

// Offline fallback HTML
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ClearCut - Offline</title>
    <style>
        body {
            margin: 0;
            padding: 2rem;
            background: #0b0f19;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            box-sizing: border-box;
        }
        .offline-card {
            max-width: 460px;
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid rgba(56, 189, 248, 0.2);
            border-radius: 16px;
            padding: 2.5rem 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .offline-icon {
            width: 64px;
            height: 64px;
            margin-bottom: 1.25rem;
            fill: #38bdf8;
        }
        h1 { margin: 0 0 0.75rem; font-size: 1.5rem; color: #ffffff; }
        p { margin: 0 0 1.5rem; color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
        .btn-retry {
            display: inline-block;
            background: linear-gradient(135deg, #0284c7, #38bdf8);
            color: #ffffff;
            padding: 0.75rem 1.75rem;
            border-radius: 9999px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            font-size: 0.95rem;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
        }
    </style>
</head>
<body>
    <div class="offline-card">
        <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <h1>You're Currently Offline</h1>
        <p>ClearCut needs an active connection to process AI background removal. Please check your internet connection and try again.</p>
        <button class="btn-retry" onclick="window.location.reload()">Retry Connection</button>
    </div>
</body>
</html>`;

// 1. Install: Precache App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Cache precache assets with resilience (continue even if one fails)
            return Promise.allSettled(
                PRECACHE_ASSETS.map((url) =>
                    fetch(url).then((response) => {
                        if (response.ok) {
                            return cache.put(url, response);
                        }
                    }).catch(() => {})
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// 2. Activate: Clean Old Caches & Claim Clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name.startsWith('clearcut-pwa-') && name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch: Intelligent Routing & Strategies
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Bypass Service Worker for non-GET requests (e.g. POST image upload)
    if (request.method !== 'GET') {
        return;
    }

    // Bypass Service Worker for dynamic API processing, downloads, and versioned assets
    if (url.pathname.includes('/api/process.php') || url.pathname.includes('/api/download.php') || url.searchParams.has('v')) {
        return;
    }

    // HTML Navigation requests: Network-First with Cache Fallback & Offline Page
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Return offline fallback
                    return new Response(OFFLINE_FALLBACK_HTML, {
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                    });
                });
            })
        );
        return;
    }

    // Static Assets (CSS, JS, Images, Icons): Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Ignore network errors for background revalidation
            });

            return cachedResponse || fetchPromise;
        })
    );
});
