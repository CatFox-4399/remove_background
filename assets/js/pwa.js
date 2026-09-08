/**
 * ClearCut PWA Engine (assets/js/pwa.js)
 * Service Worker Registration, Install Banner/Button Prompt, and Offline Notifications
 */

(function () {
    'use strict';

    let deferredPrompt = null;
    const btnPwaInstall = document.getElementById('btnPwaInstall');

    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    // Check for updates periodically
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('[ClearCut PWA] New update available.');
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.warn('[ClearCut PWA] ServiceWorker registration failed:', error);
                });
        });
    }

    // 2. Check if already running in standalone PWA mode
    function isRunningStandalone() {
        return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
               (window.navigator.standalone === true) ||
               document.referrer.includes('android-app://');
    }

    // 3. Handle beforeinstallprompt (Chrome, Edge, Android, Opera)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent browser's default prompt
        e.preventDefault();
        deferredPrompt = e;

        // Display the install button in navigation header
        if (btnPwaInstall && !isRunningStandalone()) {
            btnPwaInstall.style.display = 'inline-flex';
        }
    });

    // 4. Install Button Click Handler
    if (btnPwaInstall) {
        btnPwaInstall.addEventListener('click', async () => {
            if (!deferredPrompt) {
                // If deferredPrompt isn't available (e.g. Safari / iOS or already triggered)
                showInstallHelp();
                return;
            }

            // Trigger prompt
            deferredPrompt.prompt();
            try {
                const choice = await deferredPrompt.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    btnPwaInstall.style.display = 'none';
                }
            } catch (err) {
                console.error('[ClearCut PWA] Error displaying install prompt:', err);
            }
            deferredPrompt = null;
        });
    }

    // 5. Handle appinstalled event
    window.addEventListener('appinstalled', () => {
        console.log('[ClearCut PWA] Application installed successfully.');
        if (btnPwaInstall) {
            btnPwaInstall.style.display = 'none';
        }
        deferredPrompt = null;
        showPwaToast('ClearCut installed successfully!');
    });

    // 6. Manual instructions for iOS / browsers without beforeinstallprompt
    function showInstallHelp() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            alert('To install on iPhone/iPad: Tap the Share button (⎋) in Safari, then select "Add to Home Screen" (+).');
        } else {
            alert('To install ClearCut: Click your browser address bar icon (⊕) or menu (⋮) and select "Install ClearCut".');
        }
    }

    // 7. Mini PWA Toast Notification
    function showPwaToast(message) {
        const toast = document.createElement('div');
        toast.className = 'pwa-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 50);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    // 8. Online / Offline Status Detection
    window.addEventListener('online', () => {
        showPwaToast('Online connection restored.');
    });

    window.addEventListener('offline', () => {
        showPwaToast('You are offline. Image Studio features remain accessible!');
    });
})();
