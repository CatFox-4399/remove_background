<?php
/**
 * ClearCut - User Manual
 * Comprehensive Documentation - Multilingual (manual.php)
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/languages.php';
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($currentLang); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?php echo htmlspecialchars(t('manual_subtitle')); ?>">
    <title><?php echo htmlspecialchars(t('manual_title')); ?> - ClearCut</title>

    <!-- PWA & Mobile Meta Tags -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0b0f19">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="ClearCut">
    <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
    <link rel="icon" type="image/svg+xml" href="assets/icons/icon.svg">
    <link rel="icon" type="image/png" sizes="192x192" href="assets/icons/icon-192.png">

    <!-- Stylesheets -->
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="assets/css/manual.css">
</head>
<body>

    <!-- Site Header -->
    <header class="site-header">
        <div class="header-container">
            <a href="<?php echo htmlspecialchars(lang_url('index.php')); ?>" class="brand-logo" aria-label="ClearCut Home">
                <div class="brand-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                    </svg>
                </div>
                <span>ClearCut</span>
            </a>

            <div class="header-actions">
                <nav aria-label="Main Navigation">
                    <ul class="nav-links">
                        <li><a href="<?php echo htmlspecialchars(lang_url('index.php')); ?>" class="nav-link"><?php echo htmlspecialchars(t('home')); ?></a></li>
                        <li><a href="<?php echo htmlspecialchars(lang_url('manual.php')); ?>" class="nav-link active"><?php echo htmlspecialchars(t('manual')); ?></a></li>
                    </ul>
                </nav>

                <!-- PWA Install Button -->
                <button type="button" id="btnPwaInstall" class="pwa-install-btn" style="display: none;" title="<?php echo htmlspecialchars(t('pwa_install_title')); ?>">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span><?php echo htmlspecialchars(t('pwa_install_btn')); ?></span>
                </button>

                <!-- Language Selector Dropdown -->
                <?php render_language_selector(); ?>
            </div>
        </div>
    </header>

    <!-- User Manual Container -->
    <main class="manual-wrapper">

        <!-- Manual Header -->
        <div class="manual-header">
            <div class="manual-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span><?php echo htmlspecialchars(t('manual_badge')); ?></span>
            </div>
            <h1 class="manual-title"><?php echo htmlspecialchars(t('manual_title')); ?></h1>
            <p class="manual-subtitle"><?php echo htmlspecialchars(t('manual_subtitle')); ?></p>
        </div>

        <!-- 1. Overview Section -->
        <section class="manual-section">
            <div class="section-heading">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <h2><?php echo htmlspecialchars(t('sec_overview')); ?></h2>
            </div>
            <div class="section-body">
                <p><?php echo htmlspecialchars(t('overview_p1')); ?></p>
                <p><?php echo htmlspecialchars(t('overview_p2')); ?></p>
            </div>
        </section>

        <!-- 2. How to Use Section -->
        <section class="manual-section">
            <div class="section-heading">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                </div>
                <h2><?php echo htmlspecialchars(t('sec_how_to')); ?></h2>
            </div>
            <div class="section-body">
                <div class="steps-list">
                    <div class="step-card">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step1_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step1_desc')); ?></p>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step2_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step2_desc')); ?></p>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step3_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step3_desc')); ?></p>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step4_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step4_desc')); ?></p>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">5</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step5_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step5_desc')); ?></p>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">6</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step6_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step6_desc')); ?></p>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">7</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step7_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step7_desc')); ?></p>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">8</div>
                        <div class="step-content">
                            <h4><?php echo htmlspecialchars(t('step8_title')); ?></h4>
                            <p><?php echo htmlspecialchars(t('step8_desc')); ?></p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 3. Interface Explanation -->
        <section class="manual-section">
            <div class="section-heading">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                <h2><?php echo htmlspecialchars(t('sec_ui')); ?></h2>
            </div>
            <div class="section-body">
                <div class="ui-elements-grid">
                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_upload_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_upload_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_preview_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_preview_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_remove_btn_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_remove_btn_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_status_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_status_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_orig_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_orig_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_result_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_result_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_down_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_down_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_another_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_another_desc')); ?></p>
                    </div>

                    <div class="ui-element-item">
                        <h4><?php echo htmlspecialchars(t('ui_studio_btn_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('ui_studio_btn_desc')); ?></p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 4. Image Studio Section -->
        <section class="manual-section">
            <div class="section-heading">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </div>
                <h2><?php echo htmlspecialchars(t('sec_studio')); ?></h2>
            </div>
            <div class="section-body">
                <p><?php echo htmlspecialchars(t('studio_p1')); ?></p>
                <p><?php echo htmlspecialchars(t('studio_p2')); ?></p>
                <p><?php echo htmlspecialchars(t('studio_p3')); ?></p>
            </div>
        </section>

        <!-- 5. Supported Formats -->
        <section class="manual-section">
            <div class="section-heading">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <h2><?php echo htmlspecialchars(t('sec_formats')); ?></h2>
            </div>
            <div class="section-body">
                <p><?php echo htmlspecialchars(t('formats_p1')); ?></p>
                <div class="format-tags">
                    <span class="format-pill">JPG / JPEG</span>
                    <span class="format-pill">PNG</span>
                    <span class="format-pill">WEBP</span>
                    <span class="format-pill">GIF</span>
                </div>
                <p><?php echo htmlspecialchars(t('formats_p2')); ?></p>
            </div>
        </section>

        <!-- 5. Tips for Best Results -->
        <section class="manual-section">
            <div class="section-heading">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
                </div>
                <h2><?php echo htmlspecialchars(t('sec_tips')); ?></h2>
            </div>
            <div class="section-body">
                <div class="tips-grid">
                    <div class="tip-card">
                        <h4><?php echo htmlspecialchars(t('tip1_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('tip1_desc')); ?></p>
                    </div>

                    <div class="tip-card">
                        <h4><?php echo htmlspecialchars(t('tip2_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('tip2_desc')); ?></p>
                    </div>

                    <div class="tip-card">
                        <h4><?php echo htmlspecialchars(t('tip3_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('tip3_desc')); ?></p>
                    </div>

                    <div class="tip-card">
                        <h4><?php echo htmlspecialchars(t('tip4_title')); ?></h4>
                        <p><?php echo htmlspecialchars(t('tip4_desc')); ?></p>
                    </div>
                </div>
            </div>
        </section>

        <!-- 6. FAQ Section -->
        <section class="manual-section">
            <div class="section-heading">
                <div class="section-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h2><?php echo htmlspecialchars(t('sec_faq')); ?></h2>
            </div>
            <div class="section-body">
                <div class="faq-list">

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq1_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq1_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq2_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq2_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq_studio_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq_studio_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq3_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq3_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq4_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq4_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq5_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq5_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq6_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq6_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq7_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq7_a')); ?></p>
                        </div>
                    </div>

                    <div class="faq-item">
                        <button type="button" class="faq-question" aria-expanded="false">
                            <span><?php echo htmlspecialchars(t('faq8_q')); ?></span>
                            <svg class="faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div class="faq-answer">
                            <p><?php echo htmlspecialchars(t('faq8_a')); ?></p>
                        </div>
                    </div>

                </div>
            </div>
        </section>

    </main>

    <!-- Footer Component -->
    <?php require_once __DIR__ . '/includes/footer.php'; ?>

    <!-- Scripts -->
    <script src="assets/js/manual.js"></script>
    <script src="assets/js/pwa.js" defer></script>
</body>
</html>
