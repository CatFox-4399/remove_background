<?php
/**
 * ClearCut - AI Image Background Removal Web Application
 * Main Application Interface (index.php) - Multilingual
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/languages.php';
?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($currentLang); ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?php echo htmlspecialchars(t('meta_desc')); ?>">
    <meta name="keywords" content="background removal, remove bg, transparent png, pixelcut, ai image processing">
    <meta name="author" content="ClearCut">
    <title>ClearCut - <?php echo htmlspecialchars(t('hero_title_highlight')); ?></title>

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
                        <li><a href="<?php echo htmlspecialchars(lang_url('index.php')); ?>" class="nav-link active"><?php echo htmlspecialchars(t('home')); ?></a></li>
                        <li><a href="<?php echo htmlspecialchars(lang_url('manual.php')); ?>" class="nav-link"><?php echo htmlspecialchars(t('manual')); ?></a></li>
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

    <!-- Main Container -->
    <main class="main-wrapper">

        <!-- Hero Section -->
        <section class="hero-section">
            <div class="hero-pill">
                <span class="hero-pill-dot"></span>
                <span><?php echo htmlspecialchars(t('powered_by')); ?></span>
            </div>
            <h1 class="hero-title"><?php echo htmlspecialchars(t('hero_title_1')); ?><span class="gradient-text"><?php echo htmlspecialchars(t('hero_title_highlight')); ?></span></h1>
            <p class="hero-subtitle"><?php echo htmlspecialchars(t('hero_subtitle')); ?></p>
        </section>

        <!-- Global Alert / Error Banner -->
        <div id="errorAlert" class="alert-banner alert-danger" role="alert" aria-live="assertive">
            <div class="alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="alert-content" id="errorMessageText">
                An error occurred.
            </div>
            <button type="button" class="alert-close" id="btnCloseAlert" aria-label="Close error message">&times;</button>
        </div>

        <!-- Main Application Card -->
        <div class="app-card">

            <!-- 1. Drag & Drop Upload Zone -->
            <div id="uploadDropzone" class="upload-dropzone" tabindex="0" role="button" aria-label="Upload image area. Drag and drop or click to choose an image.">
                <div class="upload-icon-wrapper">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>
                <h2 class="upload-heading"><?php echo htmlspecialchars(t('drop_heading')); ?></h2>
                <p class="upload-subtext"><?php echo htmlspecialchars(t('drop_subtext')); ?></p>
                <button type="button" id="btnSelectFile" class="btn-file-select">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span><?php echo htmlspecialchars(t('choose_image')); ?></span>
                </button>

                <div class="upload-format-info">
                    <div class="format-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>JPG / JPEG</span>
                    </div>
                    <div class="format-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>PNG</span>
                    </div>
                    <div class="format-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>WEBP</span>
                    </div>
                    <div class="format-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>GIF</span>
                    </div>
                    <div class="format-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span><?php echo htmlspecialchars(t('format_max')); ?></span>
                    </div>
                </div>

                <!-- Hidden Native File Input -->
                <input type="file" id="fileInput" class="hidden-file-input" accept="image/jpeg,image/png,image/webp,image/gif" aria-hidden="true">
            </div>

            <!-- 2. Selected Image Preview Card -->
            <div id="previewCard" class="preview-card" aria-live="polite">
                <div class="preview-header">
                    <h3 class="preview-title"><?php echo htmlspecialchars(t('selected_image')); ?></h3>
                    <button type="button" id="btnClearImage" class="btn-clear" title="<?php echo htmlspecialchars(t('clear_image')); ?>">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span><?php echo htmlspecialchars(t('clear_image')); ?></span>
                    </button>
                </div>

                <div class="preview-content">
                    <div class="preview-thumbnail-box">
                        <img id="previewImg" src="" alt="Selected image preview">
                    </div>
                    <div class="preview-meta">
                        <p class="preview-filename" id="previewName">filename.jpg</p>
                        <p class="preview-filesize" id="previewSize">0 KB</p>
                        <div class="preview-actions-inline">
                            <button type="button" class="btn-clear" onclick="document.getElementById('fileInput').click();">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                <span><?php echo htmlspecialchars(t('change_image')); ?></span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="preview-cta-bar">
                    <button type="button" id="btnEditOriginal" class="btn-secondary-action btn-studio-trigger" title="<?php echo htmlspecialchars(t('btn_edit_original')); ?>">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        <span><?php echo htmlspecialchars(t('btn_edit_original')); ?></span>
                    </button>
                    <button type="button" id="btnProcess" class="btn-primary-action">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path>
                        </svg>
                        <span><?php echo htmlspecialchars(t('btn_remove_bg')); ?></span>
                    </button>
                </div>
            </div>

            <!-- 3. Processing State -->
            <div id="processingCard" class="processing-card" aria-live="assertive">
                <div class="spinner-outer">
                    <div class="spinner-glow"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h3 class="processing-heading"><?php echo htmlspecialchars(t('processing_heading')); ?></h3>
                <p id="processingStatusText" class="processing-status-text"><?php echo htmlspecialchars(t('stage_uploading')); ?></p>
                <p class="processing-note"><?php echo htmlspecialchars(t('processing_note')); ?></p>
            </div>

            <!-- 4. Result Section -->
            <div id="resultSection" class="result-section" aria-live="polite">
                <div class="result-header">
                    <div>
                        <div class="result-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span><?php echo htmlspecialchars(t('bg_removed')); ?></span>
                        </div>
                    </div>
                    <p class="preview-filesize"><?php echo htmlspecialchars(t('png_ready')); ?></p>
                </div>

                <!-- Side-by-Side (Desktop) / Stacked (Mobile) Comparison Grid -->
                <div class="result-comparison-grid">
                    <div class="comparison-box">
                        <div class="comparison-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            <span><?php echo htmlspecialchars(t('original_img')); ?></span>
                        </div>
                        <div class="image-canvas canvas-original">
                            <img id="originalResultImg" src="" alt="Original uploaded image">
                        </div>
                    </div>

                    <div class="comparison-box">
                        <div class="comparison-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                            <span><?php echo htmlspecialchars(t('result_img')); ?></span>
                        </div>
                        <!-- Checkerboard container clearly highlights transparency -->
                        <div class="image-canvas canvas-checkerboard">
                            <img id="processedResultImg" src="" alt="Background removed transparent PNG">
                        </div>
                    </div>
                </div>

                <!-- Result Actions Bar -->
                <div class="result-actions-bar">
                    <div class="result-actions-group">
                        <button type="button" id="btnUploadAnother" class="btn-secondary-action">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                                <path d="M16 21h5v-5"></path>
                            </svg>
                            <span><?php echo htmlspecialchars(t('upload_another')); ?></span>
                        </button>

                        <button type="button" id="btnEditResult" class="btn-secondary-action btn-studio-trigger">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span><?php echo htmlspecialchars(t('btn_edit_result')); ?></span>
                        </button>
                    </div>

                    <a id="btnDownload" href="#" class="btn-download-action" download="no-bg.png">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span><?php echo htmlspecialchars(t('download_png')); ?></span>
                    </a>
                </div>
            </div>

        </div>

        <!-- 5. Image Studio Modal Overlay -->
        <div id="imageStudioModal" class="studio-modal-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="studioModalTitle">
            <div class="studio-modal-container">
                <div class="studio-modal-header">
                    <div class="studio-header-title">
                        <div class="studio-header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                        </div>
                        <h3 id="studioModalTitle"><?php echo htmlspecialchars(t('editor_title')); ?></h3>
                    </div>
                    <button type="button" class="studio-modal-close" id="btnStudioClose" aria-label="Close studio">&times;</button>
                </div>

                <div class="studio-modal-body">
                    <!-- Canvas Preview Area -->
                    <div class="studio-canvas-area">
                        <div class="studio-canvas-wrapper canvas-checkerboard" id="studioCanvasWrapper">
                            <canvas id="studioCanvas"></canvas>
                        </div>
                    </div>

                    <!-- Studio Controls Sidebar -->
                    <div class="studio-sidebar">
                        <!-- Top Category Switcher: Separates Standard Tools from New Features -->
                        <div class="studio-category-nav" role="tablist" aria-label="Tool category">
                            <button type="button" class="category-pill-btn active" data-category="core" id="btnCatCore">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                <span><?php echo htmlspecialchars(t('studio_core_tools')); ?></span>
                            </button>
                            <button type="button" class="category-pill-btn btn-cat-new" data-category="new" id="btnCatNew">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                <span><?php echo htmlspecialchars(t('studio_new_features')); ?></span>
                                <span class="category-badge-pill">4 NEW</span>
                            </button>
                        </div>

                        <!-- Core Tools Tabs (3 Spacious Tabs) -->
                        <div class="studio-tabs studio-tabs-core active" id="tabsGroupCore" role="tablist">
                            <button type="button" class="studio-tab active" data-tab="crop" role="tab" aria-selected="true" title="<?php echo htmlspecialchars(t('tab_crop')); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>
                                <span><?php echo htmlspecialchars(t('tab_crop')); ?></span>
                            </button>
                            <button type="button" class="studio-tab" data-tab="rotate" role="tab" aria-selected="false" title="<?php echo htmlspecialchars(t('tab_rotate')); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                                <span><?php echo htmlspecialchars(t('tab_rotate')); ?></span>
                            </button>
                            <button type="button" class="studio-tab" data-tab="filters" role="tab" aria-selected="false" title="<?php echo htmlspecialchars(t('tab_filters')); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a7 7 0 0 0 0 14 7 7 0 0 0 0-14z"></path></svg>
                                <span><?php echo htmlspecialchars(t('tab_filters')); ?></span>
                            </button>
                        </div>

                        <!-- Dedicated Separated New Feature Tabs (4 Spacious Tabs) -->
                        <div class="studio-tabs studio-tabs-new" id="tabsGroupNew" role="tablist">
                            <button type="button" class="studio-tab studio-tab-new" data-tab="chop_free" role="tab" aria-selected="false" title="<?php echo htmlspecialchars(t('tab_chop_free')); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                <span><?php echo htmlspecialchars(t('tab_chop_free')); ?></span>
                            </button>
                            <button type="button" class="studio-tab studio-tab-new" data-tab="resize" role="tab" aria-selected="false" title="<?php echo htmlspecialchars(t('tab_resize')); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                                <span><?php echo htmlspecialchars(t('tab_resize')); ?></span>
                            </button>
                            <button type="button" class="studio-tab studio-tab-new" data-tab="vignette" role="tab" aria-selected="false" title="<?php echo htmlspecialchars(t('tab_vignette')); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.35"></circle></svg>
                                <span><?php echo htmlspecialchars(t('tab_vignette')); ?></span>
                            </button>
                            <button type="button" class="studio-tab studio-tab-new" data-tab="text" role="tab" aria-selected="false" title="<?php echo htmlspecialchars(t('tab_text')); ?>">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
                                <span><?php echo htmlspecialchars(t('tab_text')); ?></span>
                            </button>
                        </div>

                        <!-- Tab 1: Crop (Aspect Ratios) -->
                        <div class="studio-tab-content active" id="tabContentCrop">
                            <p class="studio-panel-label"><?php echo htmlspecialchars(t('tab_crop')); ?></p>
                            <div class="aspect-ratio-grid">
                                <button type="button" class="ratio-btn active" data-ratio="free">
                                    <span class="ratio-box ratio-box-free"></span>
                                    <span><?php echo htmlspecialchars(t('aspect_free')); ?></span>
                                </button>
                                <button type="button" class="ratio-btn" data-ratio="1:1">
                                    <span class="ratio-box ratio-box-1-1"></span>
                                    <span><?php echo htmlspecialchars(t('aspect_1_1')); ?></span>
                                </button>
                                <button type="button" class="ratio-btn" data-ratio="4:3">
                                    <span class="ratio-box ratio-box-4-3"></span>
                                    <span><?php echo htmlspecialchars(t('aspect_4_3')); ?></span>
                                </button>
                                <button type="button" class="ratio-btn" data-ratio="16:9">
                                    <span class="ratio-box ratio-box-16-9"></span>
                                    <span><?php echo htmlspecialchars(t('aspect_16_9')); ?></span>
                                </button>
                                <button type="button" class="ratio-btn" data-ratio="3:4">
                                    <span class="ratio-box ratio-box-3-4"></span>
                                    <span><?php echo htmlspecialchars(t('aspect_3_4')); ?></span>
                                </button>
                                <button type="button" class="ratio-btn" data-ratio="9:16">
                                    <span class="ratio-box ratio-box-9-16"></span>
                                    <span><?php echo htmlspecialchars(t('aspect_9_16')); ?></span>
                                </button>
                            </div>

                            <!-- Extrude Entire Picture to Square (No Crop / 1:1 Stretch) -->
                            <div class="extrude-square-panel">
                                <p class="studio-panel-label" style="margin-top: 16px; margin-bottom: 8px;"><?php echo htmlspecialchars(t('btn_extrude_square')); ?></p>
                                <button type="button" class="btn-extrude-square" id="btnExtrudeSquare" title="<?php echo htmlspecialchars(t('extrude_square_hint')); ?>">
                                    <div class="extrude-btn-content">
                                        <div class="extrude-icon-wrap">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                                <path d="M7 12h10M12 7v10"></path>
                                            </svg>
                                        </div>
                                        <div class="extrude-btn-text">
                                            <span class="extrude-btn-title"><?php echo htmlspecialchars(t('btn_extrude_square')); ?></span>
                                            <span class="extrude-btn-desc"><?php echo htmlspecialchars(t('extrude_square_hint')); ?></span>
                                        </div>
                                    </div>
                                    <span class="extrude-badge-status" id="extrudeStatusBadge"><?php echo htmlspecialchars(t('extrude_off')); ?></span>
                                </button>
                            </div>
                        </div>

                        <!-- Tab 2: Turn & Flip -->
                        <div class="studio-tab-content" id="tabContentRotate">
                            <p class="studio-panel-label"><?php echo htmlspecialchars(t('tab_rotate')); ?></p>
                            <div class="tool-btn-grid">
                                <button type="button" class="studio-tool-btn" id="btnRotateLeft">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                                    <span><?php echo htmlspecialchars(t('rotate_left')); ?></span>
                                </button>
                                <button type="button" class="studio-tool-btn" id="btnRotateRight">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                                    <span><?php echo htmlspecialchars(t('rotate_right')); ?></span>
                                </button>
                                <button type="button" class="studio-tool-btn" id="btnFlipH">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><polyline points="3 8 3 3 8 3"></polyline><line x1="3" y1="3" x2="9" y2="9"></line></svg>
                                    <span><?php echo htmlspecialchars(t('flip_h')); ?></span>
                                </button>
                                <button type="button" class="studio-tool-btn" id="btnFlipV">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"></line><polyline points="19 9 12 2 5 9"></polyline><polyline points="19 15 12 22 5 15"></polyline></svg>
                                    <span><?php echo htmlspecialchars(t('flip_v')); ?></span>
                                </button>
                            </div>
                        </div>

                        <!-- Tab 3: Color Filters & Adjustments -->
                        <div class="studio-tab-content" id="tabContentFilters">
                            <p class="studio-panel-label"><?php echo htmlspecialchars(t('tab_filters')); ?></p>
                            <!-- Filter Preset Badges -->
                            <div class="filter-pills-grid">
                                <button type="button" class="filter-pill active" data-filter="normal"><?php echo htmlspecialchars(t('filter_normal')); ?></button>
                                <button type="button" class="filter-pill" data-filter="vivid"><?php echo htmlspecialchars(t('filter_vivid')); ?></button>
                                <button type="button" class="filter-pill" data-filter="bw"><?php echo htmlspecialchars(t('filter_bw')); ?></button>
                                <button type="button" class="filter-pill" data-filter="sepia"><?php echo htmlspecialchars(t('filter_sepia')); ?></button>
                                <button type="button" class="filter-pill" data-filter="vintage"><?php echo htmlspecialchars(t('filter_vintage')); ?></button>
                                <button type="button" class="filter-pill" data-filter="warm"><?php echo htmlspecialchars(t('filter_warm')); ?></button>
                                <button type="button" class="filter-pill" data-filter="cool"><?php echo htmlspecialchars(t('filter_cool')); ?></button>
                                <button type="button" class="filter-pill" data-filter="contrast"><?php echo htmlspecialchars(t('filter_contrast')); ?></button>
                            </div>

                            <!-- Sliders -->
                            <div class="studio-sliders">
                                <div class="slider-item">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('brightness')); ?></span>
                                        <span id="valBrightness">0%</span>
                                    </div>
                                    <input type="range" id="rangeBrightness" min="-50" max="50" value="0" class="studio-range">
                                </div>
                                <div class="slider-item">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('contrast')); ?></span>
                                        <span id="valContrast">0%</span>
                                    </div>
                                    <input type="range" id="rangeContrast" min="-50" max="50" value="0" class="studio-range">
                                </div>
                                <div class="slider-item">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('saturation')); ?></span>
                                        <span id="valSaturation">0%</span>
                                    </div>
                                    <input type="range" id="rangeSaturation" min="-50" max="50" value="0" class="studio-range">
                                </div>
                            </div>
                        </div>

                        <!-- Tab 4: [NEW FEATURE] Chop Free & Any Shape -->
                        <div class="studio-tab-content" id="tabContentChopFree">
                            <div class="new-feature-tab-banner">
                                <span class="tab-badge-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                                <span class="new-tab-banner-text"><?php echo htmlspecialchars(t('new_feat_chop_title')); ?></span>
                            </div>

                            <p class="studio-panel-label"><?php echo htmlspecialchars(t('shape_chop')); ?></p>
                            <div class="shape-chopper-grid">
                                <button type="button" class="shape-btn active" data-shape="rect" title="<?php echo htmlspecialchars(t('shape_rect')); ?>">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"></rect></svg>
                                    <span><?php echo htmlspecialchars(t('shape_rect')); ?></span>
                                </button>
                                <button type="button" class="shape-btn" data-shape="circle" title="<?php echo htmlspecialchars(t('shape_circle')); ?>">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle></svg>
                                    <span><?php echo htmlspecialchars(t('shape_circle')); ?></span>
                                </button>
                                <button type="button" class="shape-btn" data-shape="rounded" title="<?php echo htmlspecialchars(t('shape_rounded')); ?>">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="6"></rect></svg>
                                    <span><?php echo htmlspecialchars(t('shape_rounded')); ?></span>
                                </button>
                                <button type="button" class="shape-btn" data-shape="heart" title="<?php echo htmlspecialchars(t('shape_heart')); ?>">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    <span><?php echo htmlspecialchars(t('shape_heart')); ?></span>
                                </button>
                                <button type="button" class="shape-btn" data-shape="star" title="<?php echo htmlspecialchars(t('shape_star')); ?>">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    <span><?php echo htmlspecialchars(t('shape_star')); ?></span>
                                </button>
                            </div>

                            <!-- Freeform Chop Margin Sliders -->
                            <p class="studio-panel-label" style="margin-top: 14px;"><?php echo htmlspecialchars(t('free_crop_label')); ?></p>
                            <div class="crop-margins-grid">
                                <div class="crop-margin-item">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('crop_top')); ?></span>
                                        <span id="valCropTop">0%</span>
                                    </div>
                                    <input type="range" id="rangeCropTop" min="0" max="45" value="0" class="studio-range">
                                </div>
                                <div class="crop-margin-item">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('crop_bottom')); ?></span>
                                        <span id="valCropBottom">0%</span>
                                    </div>
                                    <input type="range" id="rangeCropBottom" min="0" max="45" value="0" class="studio-range">
                                </div>
                                <div class="crop-margin-item">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('crop_left')); ?></span>
                                        <span id="valCropLeft">0%</span>
                                    </div>
                                    <input type="range" id="rangeCropLeft" min="0" max="45" value="0" class="studio-range">
                                </div>
                                <div class="crop-margin-item">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('crop_right')); ?></span>
                                        <span id="valCropRight">0%</span>
                                    </div>
                                    <input type="range" id="rangeCropRight" min="0" max="45" value="0" class="studio-range">
                                </div>
                            </div>
                        </div>

                        <!-- Tab 5: [NEW FEATURE] Resize Picture -->
                        <div class="studio-tab-content" id="tabContentResize">
                            <div class="new-feature-tab-banner">
                                <span class="tab-badge-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                                <span class="new-tab-banner-text"><?php echo htmlspecialchars(t('new_feat_resize_title')); ?></span>
                            </div>

                            <p class="studio-panel-label"><?php echo htmlspecialchars(t('resize_title')); ?></p>
                            
                            <div class="resize-inputs-wrapper">
                                <div class="resize-input-group">
                                    <label for="inputResizeWidth"><?php echo htmlspecialchars(t('width_px')); ?></label>
                                    <input type="number" id="inputResizeWidth" min="20" max="5000" step="1" class="studio-number-input">
                                </div>

                                <button type="button" class="btn-lock-aspect active" id="btnLockAspect" title="<?php echo htmlspecialchars(t('lock_ratio')); ?>">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                    </svg>
                                </button>

                                <div class="resize-input-group">
                                    <label for="inputResizeHeight"><?php echo htmlspecialchars(t('height_px')); ?></label>
                                    <input type="number" id="inputResizeHeight" min="20" max="5000" step="1" class="studio-number-input">
                                </div>
                            </div>

                            <p class="resize-info-badge" id="origDimIndicator"><?php echo htmlspecialchars(t('orig_dim')); ?>: 0 &times; 0 px</p>

                            <p class="studio-panel-label" style="margin-top: 14px;"><?php echo htmlspecialchars(t('scale_presets')); ?></p>
                            <div class="scale-presets-grid">
                                <button type="button" class="scale-btn" data-scale="0.25">25%</button>
                                <button type="button" class="scale-btn" data-scale="0.5">50%</button>
                                <button type="button" class="scale-btn" data-scale="0.75">75%</button>
                                <button type="button" class="scale-btn active" data-scale="1.0">100%</button>
                                <button type="button" class="scale-btn" data-scale="1.5">150%</button>
                                <button type="button" class="scale-btn" data-scale="2.0">200%</button>
                            </div>

                            <button type="button" class="scale-btn btn-extrude-shortcut" id="btnResizeExtrudeSquare" style="width: 100%; margin-top: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 12h10M12 7v10"></path></svg>
                                <span><?php echo htmlspecialchars(t('extrude_square_short')); ?></span>
                            </button>
                        </div>

                        <!-- Tab 6: [NEW FEATURE] Vignette Edge Shading -->
                        <div class="studio-tab-content" id="tabContentVignette">
                            <div class="new-feature-tab-banner">
                                <span class="tab-badge-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                                <span class="new-tab-banner-text"><?php echo htmlspecialchars(t('new_feat_vignette_title')); ?></span>
                            </div>

                            <p class="studio-panel-label"><?php echo htmlspecialchars(t('vignette')); ?></p>
                            
                            <div class="slider-item" style="margin-bottom: 1rem;">
                                <div class="slider-header">
                                    <span><?php echo htmlspecialchars(t('vignette')); ?></span>
                                    <span id="valVignette">0%</span>
                                </div>
                                <input type="range" id="rangeVignette" min="0" max="100" value="0" class="studio-range">
                            </div>

                            <button type="button" class="filter-pill" id="btnPresetVignette" style="width: 100%; margin-top: 0.5rem;">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="9"></circle></svg>
                                <span><?php echo htmlspecialchars(t('filter_vignette')); ?> (60%)</span>
                            </button>

                            <p class="drag-hint-box" style="margin-top: 1rem;">
                                <?php echo htmlspecialchars(t('vignette_panel_desc')); ?>
                            </p>
                        </div>

                        <!-- Tab 7: [NEW FEATURE] Add Text / Words -->
                        <div class="studio-tab-content" id="tabContentText">
                            <div class="new-feature-tab-banner">
                                <span class="tab-badge-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                                <span class="new-tab-banner-text"><?php echo htmlspecialchars(t('new_feat_text_title')); ?></span>
                            </div>

                            <p class="studio-panel-label"><?php echo htmlspecialchars(t('text_input_label')); ?></p>
                            <div class="text-input-wrapper">
                                <input type="text" id="studioTextInput" class="studio-text-input" placeholder="<?php echo htmlspecialchars(t('text_placeholder')); ?>">
                            </div>

                            <div class="text-controls-grid">
                                <div class="text-control-field">
                                    <label for="selectFontFamily"><?php echo htmlspecialchars(t('font_family')); ?></label>
                                    <select id="selectFontFamily" class="studio-select">
                                        <option value="sans-serif"><?php echo htmlspecialchars(t('font_sans')); ?></option>
                                        <option value="serif"><?php echo htmlspecialchars(t('font_serif')); ?></option>
                                        <option value="Impact, sans-serif"><?php echo htmlspecialchars(t('font_impact')); ?></option>
                                        <option value="'Brush Script MT', cursive, sans-serif"><?php echo htmlspecialchars(t('font_cursive')); ?></option>
                                        <option value="'Courier New', monospace"><?php echo htmlspecialchars(t('font_mono')); ?></option>
                                    </select>
                                </div>

                                <div class="text-control-field">
                                    <div class="slider-header">
                                        <span><?php echo htmlspecialchars(t('font_size')); ?></span>
                                        <span id="valFontSize">36px</span>
                                    </div>
                                    <input type="range" id="rangeFontSize" min="14" max="120" value="36" class="studio-range">
                                </div>
                            </div>

                            <?php
                            $paletteColors = [
                                '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#64748b', '#334155', '#0f172a', '#000000',
                                '#ef4444', '#dc2626', '#b91c1c', '#f97316', '#ea580c', '#f59e0b', '#d97706', '#facc15',
                                '#84cc16', '#65a30d', '#22c55e', '#16a34a', '#10b981', '#059669', '#14b8a6', '#06b6d4',
                                '#0ea5e9', '#0284c7', '#3b82f6', '#2563eb', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
                                '#ec4899', '#f43f5e', '#e11d48', '#fb7185'
                            ];
                            ?>

                            <!-- Word Color -->
                            <div class="text-effect-card">
                                <div class="text-effect-header">
                                    <span class="text-effect-title"><?php echo htmlspecialchars(t('text_color')); ?></span>
                                    <label class="custom-color-badge" for="inputTextColor" title="<?php echo htmlspecialchars(t('custom_color')); ?>">
                                        <span class="rainbow-dot"></span>
                                        <span class="badge-text"><?php echo htmlspecialchars(t('custom_color')); ?></span>
                                        <span class="hex-value" id="hexTextColor">#ffffff</span>
                                    </label>
                                </div>
                                <div class="color-picker-row">
                                    <div class="color-input-wrapper" title="<?php echo htmlspecialchars(t('custom_color')); ?>">
                                        <input type="color" id="inputTextColor" value="#ffffff" class="studio-color-input">
                                    </div>
                                    <div class="swatch-list swatch-palette-grid">
                                        <?php foreach ($paletteColors as $hex): ?>
                                            <button type="button" class="swatch-btn swatch-word<?php echo $hex === '#ffffff' ? ' active' : ''; ?>" data-color="<?php echo $hex; ?>" style="background:<?php echo $hex; ?>;<?php echo ($hex === '#000000' || $hex === '#0f172a' || $hex === '#334155') ? ' border: 1px solid #475569;' : ($hex === '#ffffff' || $hex === '#f8fafc' ? ' border: 1px solid rgba(255,255,255,0.4);' : ''); ?>" title="<?php echo $hex; ?>"></button>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            </div>

                            <!-- Word Outline (Stroke) -->
                            <div class="text-effect-card">
                                <div class="text-effect-header">
                                    <span class="text-effect-title"><?php echo htmlspecialchars(t('text_outline')); ?></span>
                                    <button type="button" class="effect-toggle-btn active" id="btnTextOutline" title="<?php echo htmlspecialchars(t('text_outline')); ?>">
                                        <span class="toggle-indicator"></span>
                                        <span class="toggle-status-text" id="statusTextOutline">ON</span>
                                    </button>
                                </div>
                                <div class="text-effect-body" id="outlineBody">
                                    <div class="text-control-field" style="margin-bottom: 8px;">
                                        <div class="slider-header" style="margin-bottom: 6px;">
                                            <span><?php echo htmlspecialchars(t('outline_color')); ?></span>
                                            <label class="custom-color-badge" for="inputOutlineColor" title="<?php echo htmlspecialchars(t('custom_color')); ?>">
                                                <span class="rainbow-dot"></span>
                                                <span class="badge-text"><?php echo htmlspecialchars(t('custom_color')); ?></span>
                                                <span class="hex-value" id="hexOutlineColor">#000000</span>
                                            </label>
                                        </div>
                                        <div class="color-picker-row">
                                            <div class="color-input-wrapper" title="<?php echo htmlspecialchars(t('custom_color')); ?>">
                                                <input type="color" id="inputOutlineColor" value="#000000" class="studio-color-input">
                                            </div>
                                            <div class="swatch-list swatch-palette-grid">
                                                <?php foreach ($paletteColors as $hex): ?>
                                                    <button type="button" class="swatch-btn swatch-outline<?php echo $hex === '#000000' ? ' active' : ''; ?>" data-color="<?php echo $hex; ?>" style="background:<?php echo $hex; ?>;<?php echo ($hex === '#000000' || $hex === '#0f172a' || $hex === '#334155') ? ' border: 1px solid #475569;' : ($hex === '#ffffff' || $hex === '#f8fafc' ? ' border: 1px solid rgba(255,255,255,0.4);' : ''); ?>" title="<?php echo $hex; ?>"></button>
                                                <?php endforeach; ?>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-control-field">
                                        <div class="slider-header">
                                            <span><?php echo htmlspecialchars(t('outline_width')); ?></span>
                                            <span id="valOutlineWidth">4px</span>
                                        </div>
                                        <input type="range" id="rangeOutlineWidth" min="1" max="24" value="4" class="studio-range">
                                    </div>
                                </div>
                            </div>

                            <!-- Word Glow (Shadow / Neon Glow) -->
                            <div class="text-effect-card">
                                <div class="text-effect-header">
                                    <span class="text-effect-title"><?php echo htmlspecialchars(t('text_glow')); ?></span>
                                    <button type="button" class="effect-toggle-btn" id="btnTextGlow" title="<?php echo htmlspecialchars(t('text_glow')); ?>">
                                        <span class="toggle-indicator"></span>
                                        <span class="toggle-status-text" id="statusTextGlow">OFF</span>
                                    </button>
                                </div>
                                <div class="text-effect-body" id="glowBody" style="display: none;">
                                    <div class="text-control-field" style="margin-bottom: 8px;">
                                        <div class="slider-header" style="margin-bottom: 6px;">
                                            <span><?php echo htmlspecialchars(t('glow_color')); ?></span>
                                            <label class="custom-color-badge" for="inputGlowColor" title="<?php echo htmlspecialchars(t('custom_color')); ?>">
                                                <span class="rainbow-dot"></span>
                                                <span class="badge-text"><?php echo htmlspecialchars(t('custom_color')); ?></span>
                                                <span class="hex-value" id="hexGlowColor">#0ea5e9</span>
                                            </label>
                                        </div>
                                        <div class="color-picker-row">
                                            <div class="color-input-wrapper" title="<?php echo htmlspecialchars(t('custom_color')); ?>">
                                                <input type="color" id="inputGlowColor" value="#0ea5e9" class="studio-color-input">
                                            </div>
                                            <div class="swatch-list swatch-palette-grid">
                                                <?php foreach ($paletteColors as $hex): ?>
                                                    <button type="button" class="swatch-btn swatch-glow<?php echo $hex === '#0ea5e9' ? ' active' : ''; ?>" data-color="<?php echo $hex; ?>" style="background:<?php echo $hex; ?>;<?php echo ($hex === '#000000' || $hex === '#0f172a' || $hex === '#334155') ? ' border: 1px solid #475569;' : ($hex === '#ffffff' || $hex === '#f8fafc' ? ' border: 1px solid rgba(255,255,255,0.4);' : ''); ?>" title="<?php echo $hex; ?>"></button>
                                                <?php endforeach; ?>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-control-field">
                                        <div class="slider-header">
                                            <span><?php echo htmlspecialchars(t('glow_blur')); ?></span>
                                            <span id="valGlowBlur">14px</span>
                                        </div>
                                        <input type="range" id="rangeGlowBlur" min="2" max="60" value="14" class="studio-range">
                                    </div>
                                </div>
                            </div>

                            <!-- Typography & Quick Position -->
                            <div class="text-style-actions" style="margin-top: 14px;">
                                <button type="button" class="style-toggle-btn active" id="btnTextBold">
                                    <b>B</b>
                                </button>
                                <button type="button" class="style-toggle-btn" id="btnTextItalic">
                                    <i>I</i>
                                </button>
                            </div>

                            <p class="studio-panel-label" style="margin-top: 14px;"><?php echo htmlspecialchars(t('text_position')); ?></p>
                            <div class="position-btn-grid">
                                <button type="button" class="pos-btn" id="btnPosTop"><?php echo htmlspecialchars(t('pos_top')); ?></button>
                                <button type="button" class="pos-btn" id="btnPosCenter"><?php echo htmlspecialchars(t('pos_center')); ?></button>
                                <button type="button" class="pos-btn active" id="btnPosBottom"><?php echo htmlspecialchars(t('pos_bottom')); ?></button>
                            </div>

                            <p class="drag-hint-box"><?php echo htmlspecialchars(t('drag_hint')); ?></p>
                        </div>
                    </div>
                </div>

                <div class="studio-modal-footer">
                    <div class="studio-footer-left">
                        <button type="button" class="btn-clear" id="btnStudioReset">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                            <span><?php echo htmlspecialchars(t('btn_reset')); ?></span>
                        </button>
                    </div>

                    <div class="studio-footer-right">
                        <button type="button" class="btn-clear" id="btnStudioCancel"><?php echo htmlspecialchars(t('btn_cancel')); ?></button>
                        <button type="button" class="btn-secondary-action" id="btnStudioApply"><?php echo htmlspecialchars(t('btn_apply_editor')); ?></button>
                        <button type="button" class="btn-download-action" id="btnStudioDownload">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span><?php echo htmlspecialchars(t('btn_download_edited')); ?></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Features Sections: Separating Core AI & New Features -->
        <div class="features-container-separated">
            <!-- 1. Core AI Background Removal Features -->
            <section class="features-block">
                <div class="features-section-header">
                    <span class="features-section-badge">AI Core</span>
                    <h2 class="features-section-title">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>
                        <span><?php echo htmlspecialchars(t('sec_core_features')); ?></span>
                    </h2>
                </div>
                <div class="features-grid">
                    <div class="feature-box">
                        <div class="feature-icon-circle">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <h3 class="feature-heading"><?php echo htmlspecialchars(t('feat1_title')); ?></h3>
                        <p class="feature-description"><?php echo htmlspecialchars(t('feat1_desc')); ?></p>
                    </div>

                    <div class="feature-box">
                        <div class="feature-icon-circle">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                        </div>
                        <h3 class="feature-heading"><?php echo htmlspecialchars(t('feat2_title')); ?></h3>
                        <p class="feature-description"><?php echo htmlspecialchars(t('feat2_desc')); ?></p>
                    </div>

                    <div class="feature-box">
                        <div class="feature-icon-circle">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <h3 class="feature-heading"><?php echo htmlspecialchars(t('feat3_title')); ?></h3>
                        <p class="feature-description"><?php echo htmlspecialchars(t('feat3_desc')); ?></p>
                    </div>
                </div>
            </section>

            <!-- 2. Brand New Features: Image Studio (Completely Separated!) -->
            <section class="features-block">
                <div class="features-section-header">
                    <span class="features-section-badge badge-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                    <h2 class="features-section-title">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        <span><?php echo htmlspecialchars(t('sec_new_features')); ?></span>
                    </h2>
                </div>
                <div class="features-grid-new">
                    <!-- New Feature 1: Chop Free & Shapes -->
                    <div class="feature-box feature-box-new">
                        <div class="feature-card-header">
                            <div class="feature-icon-circle icon-new-feat">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <span class="pill-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                        </div>
                        <h3 class="feature-heading"><?php echo htmlspecialchars(t('new_feat_chop_title')); ?></h3>
                        <p class="feature-description"><?php echo htmlspecialchars(t('new_feat_chop_desc')); ?></p>
                    </div>

                    <!-- New Feature 2: Resize Picture -->
                    <div class="feature-box feature-box-new">
                        <div class="feature-card-header">
                            <div class="feature-icon-circle icon-new-feat">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                            </div>
                            <span class="pill-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                        </div>
                        <h3 class="feature-heading"><?php echo htmlspecialchars(t('new_feat_resize_title')); ?></h3>
                        <p class="feature-description"><?php echo htmlspecialchars(t('new_feat_resize_desc')); ?></p>
                    </div>

                    <!-- New Feature 3: Vignette Edge Shading -->
                    <div class="feature-box feature-box-new">
                        <div class="feature-card-header">
                            <div class="feature-icon-circle icon-new-feat">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.35"></circle></svg>
                            </div>
                            <span class="pill-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                        </div>
                        <h3 class="feature-heading"><?php echo htmlspecialchars(t('new_feat_vignette_title')); ?></h3>
                        <p class="feature-description"><?php echo htmlspecialchars(t('new_feat_vignette_desc')); ?></p>
                    </div>

                    <!-- New Feature 4: Add Words to Picture -->
                    <div class="feature-box feature-box-new">
                        <div class="feature-card-header">
                            <div class="feature-icon-circle icon-new-feat">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
                            </div>
                            <span class="pill-new"><?php echo htmlspecialchars(t('new_badge')); ?></span>
                        </div>
                        <h3 class="feature-heading"><?php echo htmlspecialchars(t('new_feat_text_title')); ?></h3>
                        <p class="feature-description"><?php echo htmlspecialchars(t('new_feat_text_desc')); ?></p>
                    </div>
                </div>
            </section>
        </div>

    </main>

    <!-- Footer Component -->
    <?php require_once __DIR__ . '/includes/footer.php'; ?>

    <!-- Pass Translated Dynamic Strings to JavaScript -->
    <script>
        window.ClearCutI18n = {
            stages: [
                <?php echo json_encode(t('stage_uploading')); ?>,
                <?php echo json_encode(t('stage_sending')); ?>,
                <?php echo json_encode(t('stage_removing')); ?>,
                <?php echo json_encode(t('stage_preparing')); ?>,
                <?php echo json_encode(t('stage_finalizing')); ?>
            ],
            errors: {
                noFile: <?php echo json_encode(t('js_err_no_file')); ?>,
                format: <?php echo json_encode(t('js_err_format')); ?>,
                size: <?php echo json_encode(t('js_err_size')); ?>,
                empty: <?php echo json_encode(t('js_err_empty')); ?>,
                read: <?php echo json_encode(t('js_err_read')); ?>,
                network: <?php echo json_encode(t('js_err_network')); ?>,
                failed: <?php echo json_encode(t('js_err_failed')); ?>
            },
            extrudeOn: <?php echo json_encode(t('extrude_on')); ?>,
            extrudeOff: <?php echo json_encode(t('extrude_off')); ?>
        };
    </script>
    <script src="assets/js/app.js"></script>
    <script src="assets/js/pwa.js" defer></script>
</body>
</html>
