/**
 * ClearCut - Main Frontend Application Logic
 * Vanilla JavaScript (ES6+) - Multilingual Support
 */

document.addEventListener('DOMContentLoaded', () => {
    // Internationalization dictionary fallback
    const i18n = window.ClearCutI18n || {
        stages: [
            'Uploading image...',
            'Sending image to Pixelcut...',
            'Removing background with AI...',
            'Preparing transparent PNG...',
            'Finalizing result...'
        ],
        errors: {
            noFile: 'No file was selected.',
            format: 'Invalid image format. Please select a JPG, JPEG, PNG, WEBP, or GIF image.',
            size: 'File exceeds the 15 MB limit. Please select a smaller image.',
            empty: 'The selected image is empty.',
            read: 'The image could not be read.',
            network: 'An error occurred while connecting to the server.',
            failed: 'Background removal failed. Please try again.'
        }
    };

    // DOM Elements - Language Selector
    const langBtn = document.getElementById('langSelectorBtn');
    const langMenu = document.getElementById('langDropdownMenu');

    // Language Selector Interactions
    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langMenu.classList.contains('show');
            if (isOpen) {
                langMenu.classList.remove('show');
                langBtn.setAttribute('aria-expanded', 'false');
            } else {
                langMenu.classList.add('show');
                langBtn.setAttribute('aria-expanded', 'true');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!langMenu.contains(e.target) && e.target !== langBtn) {
                langMenu.classList.remove('show');
                langBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && langMenu.classList.contains('show')) {
                langMenu.classList.remove('show');
                langBtn.setAttribute('aria-expanded', 'false');
                langBtn.focus();
            }
        });
    }

    // DOM Elements - Upload & Dropzone
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    const btnSelectFile = document.getElementById('btnSelectFile');

    // DOM Elements - Preview
    const previewCard = document.getElementById('previewCard');
    const previewImg = document.getElementById('previewImg');
    const previewName = document.getElementById('previewName');
    const previewSize = document.getElementById('previewSize');
    const btnClearImage = document.getElementById('btnClearImage');
    const btnProcess = document.getElementById('btnProcess');
    const btnProcessText = document.getElementById('btnProcessText');
    const btnModeRemoveBg = document.getElementById('btnModeRemoveBg');
    const btnModeRemoveInside = document.getElementById('btnModeRemoveInside');

    // DOM Elements - Processing State
    const processingCard = document.getElementById('processingCard');
    const processingStatusText = document.getElementById('processingStatusText');

    // DOM Elements - Result Section
    const resultSection = document.getElementById('resultSection');
    const originalResultImg = document.getElementById('originalResultImg');
    const processedResultImg = document.getElementById('processedResultImg');
    const btnUploadAnother = document.getElementById('btnUploadAnother');
    const btnDownload = document.getElementById('btnDownload');
    const btnDownloadText = document.getElementById('btnDownloadText');
    const btnSwitchBg = document.getElementById('btnSwitchBg');
    const btnSwitchInside = document.getElementById('btnSwitchInside');
    const resultStatusBadge = document.getElementById('resultStatusBadge');
    const resultBadgeText = document.getElementById('resultBadgeText');
    const resultStatusSub = document.getElementById('resultStatusSub');

    // DOM Elements - Alerts
    const errorAlert = document.getElementById('errorAlert');
    const errorMessageText = document.getElementById('errorMessageText');
    const btnCloseAlert = document.getElementById('btnCloseAlert');

    // Application State
    let selectedFile = null;
    let selectedDataUrl = null;
    let isProcessing = false;
    let stageInterval = null;
    let selectedCutoutMode = 'bg'; // 'bg' (keep subject) or 'inside' (keep background)
    let activeCutoutMode = 'bg';
    let activeResultId = null;
    let cachedBgUrl = null;
    let cachedInsideDataUrl = null;
    let hasServerInside = false;

    // Constraints
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB in bytes
    const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    // Multi-stage status progression messages (from translated dictionary)
    const PROCESSING_STAGES = (i18n.stages && i18n.stages.length > 0) ? i18n.stages : [
        'Uploading image...',
        'Sending image to Pixelcut...',
        'Removing background with AI...',
        'Preparing transparent PNG...',
        'Finalizing result...'
    ];

    /**
     * Show an error alert banner
     */
    function showError(message) {
        if (errorMessageText) {
            errorMessageText.textContent = message;
        }
        if (errorAlert) {
            errorAlert.classList.add('show');
            errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Dismiss the error alert
     */
    function hideError() {
        if (errorAlert) {
            errorAlert.classList.remove('show');
        }
    }

    if (btnCloseAlert) {
        btnCloseAlert.addEventListener('click', hideError);
    }

    /**
     * Format bytes into human-readable string (KB/MB)
     */
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Validate the selected file (format, size)
     */
    function validateFile(file) {
        if (!file) {
            showError(i18n.errors.noFile || 'No file was selected.');
            return false;
        }

        const extension = file.name.split('.').pop().toLowerCase();

        if (!ALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_MIME_TYPES.includes(file.type)) {
            showError(i18n.errors.format || 'Invalid image format. Please select a JPG, JPEG, PNG, WEBP, or GIF image.');
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            showError(i18n.errors.size || 'File exceeds the 15 MB limit. Please select a smaller image.');
            return false;
        }

        if (file.size === 0) {
            showError(i18n.errors.empty || 'The selected image is empty.');
            return false;
        }

        return true;
    }

    /**
     * Handle file selection and prepare local preview
     */
    function handleFile(file) {
        hideError();

        if (!validateFile(file)) {
            return;
        }

        selectedFile = file;

        // Read file for thumbnail preview
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedDataUrl = e.target.result;
            
            // Populate preview details
            if (previewImg) previewImg.src = selectedDataUrl;
            if (previewName) previewName.textContent = file.name;
            if (previewSize) previewSize.textContent = formatFileSize(file.size);

            // Transition UI views
            if (dropzone) dropzone.style.display = 'none';
            if (processingCard) processingCard.classList.remove('show');
            if (resultSection) resultSection.classList.remove('show');
            if (previewCard) previewCard.classList.add('show');
            if (btnProcess) btnProcess.disabled = false;
        };

        reader.onerror = () => {
            showError(i18n.errors.read || 'The image could not be read.');
        };

        reader.readAsDataURL(file);
    }

    /**
     * Reset the application state to allow uploading a new image
     */
    function resetApplication() {
        hideError();
        clearInterval(stageInterval);
        isProcessing = false;
        selectedFile = null;
        selectedDataUrl = null;
        activeResultId = null;
        cachedBgUrl = null;
        cachedInsideDataUrl = null;
        hasServerInside = false;
        selectedCutoutMode = 'bg';
        activeCutoutMode = 'bg';

        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = '';
        if (previewCard) previewCard.classList.remove('show');
        if (processingCard) processingCard.classList.remove('show');
        if (resultSection) resultSection.classList.remove('show');
        if (dropzone) dropzone.style.display = 'block';

        if (btnModeRemoveBg && btnModeRemoveInside) {
            btnModeRemoveBg.classList.add('active');
            btnModeRemoveBg.setAttribute('aria-checked', 'true');
            btnModeRemoveInside.classList.remove('active');
            btnModeRemoveInside.setAttribute('aria-checked', 'false');
        }
        if (btnProcessText) {
            btnProcessText.textContent = i18n.btnRemoveBg || 'Remove Background';
        }
        if (btnSwitchBg && btnSwitchInside) {
            btnSwitchBg.classList.add('active');
            btnSwitchBg.setAttribute('aria-selected', 'true');
            btnSwitchInside.classList.remove('active');
            btnSwitchInside.setAttribute('aria-selected', 'false');
        }

        if (btnProcess) btnProcess.disabled = false;
    }

    // Mode Selector on Preview Card (Remove Background vs Remove Inside)
    if (btnModeRemoveBg && btnModeRemoveInside) {
        btnModeRemoveBg.addEventListener('click', () => {
            selectedCutoutMode = 'bg';
            btnModeRemoveBg.classList.add('active');
            btnModeRemoveBg.setAttribute('aria-checked', 'true');
            btnModeRemoveInside.classList.remove('active');
            btnModeRemoveInside.setAttribute('aria-checked', 'false');
            if (btnProcessText) {
                btnProcessText.textContent = i18n.btnRemoveBg || 'Remove Background';
            }
        });

        btnModeRemoveInside.addEventListener('click', () => {
            selectedCutoutMode = 'inside';
            btnModeRemoveInside.classList.add('active');
            btnModeRemoveInside.setAttribute('aria-checked', 'true');
            btnModeRemoveBg.classList.remove('active');
            btnModeRemoveBg.setAttribute('aria-checked', 'false');
            if (btnProcessText) {
                btnProcessText.textContent = i18n.btnRemoveInside || 'Remove Inside (Reverse)';
            }
        });
    }

    // ==========================================
    // Event Listeners: Drag & Drop
    // ==========================================
    if (dropzone) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
            document.body.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Highlight dropzone on drag
        ['dragenter', 'dragover'].forEach((eventName) => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach((eventName) => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('dragover');
            }, false);
        });

        // Drop event
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
        });

        // Click on dropzone trigger
        dropzone.addEventListener('click', (e) => {
            if (e.target !== btnSelectFile && fileInput) {
                fileInput.click();
            }
        });

        // Keyboard accessibility
        dropzone.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && fileInput) {
                e.preventDefault();
                fileInput.click();
            }
        });
    }

    // File input select
    if (btnSelectFile && fileInput) {
        btnSelectFile.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    // Clear selected file
    if (btnClearImage) {
        btnClearImage.addEventListener('click', resetApplication);
    }

    // Upload another image from result view
    if (btnUploadAnother) {
        btnUploadAnother.addEventListener('click', resetApplication);
    }

    // ==========================================
    // Process Image (AJAX via FormData)
    // ==========================================
    if (btnProcess) {
        btnProcess.addEventListener('click', async () => {
            if (isProcessing || !selectedFile) {
                return;
            }

            hideError();
            isProcessing = true;
            btnProcess.disabled = true;

            // Switch to Processing view
            if (previewCard) previewCard.classList.remove('show');
            if (processingCard) processingCard.classList.add('show');

            // Honest multi-stage status rotation
            let currentStage = 0;
            if (processingStatusText) {
                processingStatusText.textContent = PROCESSING_STAGES[0];
            }

            stageInterval = setInterval(() => {
                if (currentStage < PROCESSING_STAGES.length - 1) {
                    currentStage++;
                    if (processingStatusText) {
                        processingStatusText.textContent = PROCESSING_STAGES[currentStage];
                    }
                }
            }, 3000);

            try {
                const formData = new FormData();
                formData.append('image', selectedFile);

                const response = await fetch('api/process.php', {
                    method: 'POST',
                    body: formData
                });

                clearInterval(stageInterval);

                const data = await response.json();

                if (!response.ok || !data.success) {
                    const message = data.message || (i18n.errors.failed || 'Background removal failed. Please try again.');
                    throw new Error(message);
                }

                // Success: display result view
                const resultId = data.result;
                displayResult(resultId, data.has_inside);

            } catch (err) {
                clearInterval(stageInterval);
                isProcessing = false;

                if (processingCard) processingCard.classList.remove('show');
                if (previewCard) previewCard.classList.add('show');
                if (btnProcess) btnProcess.disabled = false;

                showError(err.message || (i18n.errors.network || 'An error occurred while connecting to the server.'));
            }
        });
    }

    /**
     * Generate reverse cutout (keep background, transparent subject inside) using client canvas
     */
    function generateInsideCutoutDataUrl(origUrl, cutoutUrl) {
        return new Promise((resolve) => {
            if (!origUrl || !cutoutUrl) return resolve(null);

            const origImg = new Image();
            origImg.crossOrigin = 'anonymous';

            origImg.onload = () => {
                const cutImg = new Image();
                cutImg.crossOrigin = 'anonymous';

                cutImg.onload = () => {
                    const w = origImg.naturalWidth || origImg.width;
                    const h = origImg.naturalHeight || origImg.height;

                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return resolve(null);

                    // 1. Draw full original image (background + subject)
                    ctx.drawImage(origImg, 0, 0, w, h);

                    // 2. Erase foreground subject using destination-out
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.drawImage(cutImg, 0, 0, w, h);

                    try {
                        const dataUrl = canvas.toDataURL('image/png');
                        resolve(dataUrl);
                    } catch (e) {
                        resolve(null);
                    }
                };

                cutImg.onerror = () => resolve(null);
                cutImg.src = cutoutUrl;
            };

            origImg.onerror = () => resolve(null);
            origImg.src = origUrl;
        });
    }

    /**
     * Render the processed result with instant mode switching
     */
    function displayResult(resultId, hasInside) {
        isProcessing = false;
        activeResultId = resultId;
        hasServerInside = !!hasInside;
        activeCutoutMode = selectedCutoutMode; // Start with the mode user chose before processing
        cachedInsideDataUrl = null;

        if (processingCard) processingCard.classList.remove('show');

        // Set original image preview
        if (originalResultImg && selectedDataUrl) {
            originalResultImg.src = selectedDataUrl;
        }

        cachedBgUrl = `api/download.php?id=${encodeURIComponent(resultId)}&preview=1`;

        // Precompute client-side inside cutout asynchronously (takes ~15ms)
        generateInsideCutoutDataUrl(selectedDataUrl, cachedBgUrl).then((insideUrl) => {
            if (insideUrl) {
                cachedInsideDataUrl = insideUrl;
                if (activeCutoutMode === 'inside') {
                    if (processedResultImg) processedResultImg.src = insideUrl;
                    if (btnDownload) btnDownload.href = insideUrl;
                }
            }
        });

        // Apply selected mode immediately
        applyResultCutoutMode(activeCutoutMode);

        // Show result section
        if (resultSection) {
            resultSection.classList.add('show');
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Switch live cutout view between Remove Background and Remove Inside
     */
    function applyResultCutoutMode(mode) {
        activeCutoutMode = mode;

        if (mode === 'bg') {
            if (btnSwitchBg) {
                btnSwitchBg.classList.add('active');
                btnSwitchBg.setAttribute('aria-selected', 'true');
            }
            if (btnSwitchInside) {
                btnSwitchInside.classList.remove('active');
                btnSwitchInside.setAttribute('aria-selected', 'false');
            }
            if (processedResultImg && cachedBgUrl) {
                processedResultImg.src = cachedBgUrl;
            }
            if (btnDownload && activeResultId) {
                btnDownload.href = `api/download.php?id=${encodeURIComponent(activeResultId)}`;
                btnDownload.download = 'no-bg.png';
            }
            if (btnDownloadText) {
                btnDownloadText.textContent = i18n.downloadPng || 'Download PNG';
            }
            if (resultBadgeText) {
                resultBadgeText.textContent = i18n.bgRemoved || 'Background Removed';
            }
            if (resultStatusSub) {
                resultStatusSub.textContent = i18n.pngReady || 'Transparent PNG Ready';
            }
            if (resultStatusBadge) {
                resultStatusBadge.classList.remove('badge-reverse');
            }
        } else {
            // mode === 'inside'
            if (btnSwitchInside) {
                btnSwitchInside.classList.add('active');
                btnSwitchInside.setAttribute('aria-selected', 'true');
            }
            if (btnSwitchBg) {
                btnSwitchBg.classList.remove('active');
                btnSwitchBg.setAttribute('aria-selected', 'false');
            }

            const serverFallbackUrl = `api/download.php?id=${encodeURIComponent(activeResultId)}&mode=inside&preview=1`;
            if (processedResultImg) {
                processedResultImg.src = cachedInsideDataUrl || serverFallbackUrl;
            }
            if (btnDownload && activeResultId) {
                btnDownload.href = cachedInsideDataUrl || `api/download.php?id=${encodeURIComponent(activeResultId)}&mode=inside`;
                btnDownload.download = 'removed-inside.png';
            }
            if (btnDownloadText) {
                btnDownloadText.textContent = i18n.downloadInsidePng || 'Download Hollow PNG';
            }
            if (resultBadgeText) {
                resultBadgeText.textContent = i18n.insideRemoved || 'Inside Removed (Reverse Cutout)';
            }
            if (resultStatusSub) {
                resultStatusSub.textContent = i18n.insidePngReady || 'Hollow Cutout PNG Ready';
            }
            if (resultStatusBadge) {
                resultStatusBadge.classList.add('badge-reverse');
            }
        }
    }

    if (btnSwitchBg) {
        btnSwitchBg.addEventListener('click', () => applyResultCutoutMode('bg'));
    }
    if (btnSwitchInside) {
        btnSwitchInside.addEventListener('click', () => applyResultCutoutMode('inside'));
    }

    // ==========================================
    // Image Studio & Editor Module
    // ==========================================
    const studioModal = document.getElementById('imageStudioModal');
    const studioCanvas = document.getElementById('studioCanvas');
    const btnStudioClose = document.getElementById('btnStudioClose');
    const btnStudioCancel = document.getElementById('btnStudioCancel');
    const btnStudioReset = document.getElementById('btnStudioReset');
    const btnStudioApply = document.getElementById('btnStudioApply');
    const btnStudioDownload = document.getElementById('btnStudioDownload');

    const btnEditOriginal = document.getElementById('btnEditOriginal');
    const btnEditResult = document.getElementById('btnEditResult');

    // Studio Controls Elements
    const rangeBrightness = document.getElementById('rangeBrightness');
    const rangeContrast = document.getElementById('rangeContrast');
    const rangeSaturation = document.getElementById('rangeSaturation');
    const rangeVignette = document.getElementById('rangeVignette');
    const inputVignetteColor = document.getElementById('inputVignetteColor');
    const hexVignetteColor = document.getElementById('hexVignetteColor');

    const valBrightness = document.getElementById('valBrightness');
    const valContrast = document.getElementById('valContrast');
    const valSaturation = document.getElementById('valSaturation');
    const valVignette = document.getElementById('valVignette');

    // Hue Rotate
    const rangeHueRotate = document.getElementById('rangeHueRotate');
    const valHueRotate = document.getElementById('valHueRotate');

    // Picture Transparency / Opacity Controls
    const rangePictureOpacity = document.getElementById('rangePictureOpacity');
    const valPictureOpacity = document.getElementById('valPictureOpacity');
    const picOpBtns = document.querySelectorAll('.pic-op-btn');

    // Cutout & Picture Drop Shadow Controls
    const btnCutoutShadow = document.getElementById('btnCutoutShadow');
    const statusCutoutShadow = document.getElementById('statusCutoutShadow');
    const cutoutShadowBody = document.getElementById('cutoutShadowBody');
    const shadowPresetBtns = document.querySelectorAll('.shadow-preset-btn');
    const inputShadowColor = document.getElementById('inputShadowColor');
    const hexShadowColor = document.getElementById('hexShadowColor');
    const rangeShadowBlur = document.getElementById('rangeShadowBlur');
    const valShadowBlur = document.getElementById('valShadowBlur');
    const rangeShadowOpacity = document.getElementById('rangeShadowOpacity');
    const valShadowOpacity = document.getElementById('valShadowOpacity');
    const rangeShadowOffsetX = document.getElementById('rangeShadowOffsetX');
    const valShadowOffsetX = document.getElementById('valShadowOffsetX');
    const rangeShadowOffsetY = document.getElementById('rangeShadowOffsetY');
    const valShadowOffsetY = document.getElementById('valShadowOffsetY');

    // Free Cut & Shape Chopper Controls
    const btnShapeFreeCut = document.getElementById('btnShapeFreeCut');
    const freeCutToolbar = document.getElementById('freeCutToolbar');
    const valFreeCutPoints = document.getElementById('valFreeCutPoints');
    const btnFreeCutModeLasso = document.getElementById('btnFreeCutModeLasso');
    const btnFreeCutModePolygon = document.getElementById('btnFreeCutModePolygon');
    const freeCutModeBtns = document.querySelectorAll('.freecut-mode-btn');
    const btnFreeCutFinish = document.getElementById('btnFreeCutFinish');
    const btnFreeCutUndo = document.getElementById('btnFreeCutUndo');
    const btnFreeCutReset = document.getElementById('btnFreeCutReset');
    const freeCutHint = document.getElementById('freeCutHint');

    // Cutout & Shape Border Stroke Controls
    const btnShapeStroke = document.getElementById('btnShapeStroke');
    const statusShapeStroke = document.getElementById('statusShapeStroke');
    const shapeStrokeBody = document.getElementById('shapeStrokeBody');
    const shapeStrokeStyleBtns = document.querySelectorAll('.shape-stroke-style-btn');
    const inputShapeStrokeColor = document.getElementById('inputShapeStrokeColor');
    const hexShapeStrokeColor = document.getElementById('hexShapeStrokeColor');
    const rangeShapeStrokeWidth = document.getElementById('rangeShapeStrokeWidth');
    const valShapeStrokeWidth = document.getElementById('valShapeStrokeWidth');

    // Freeform Crop Margin Controls
    const rangeCropTop = document.getElementById('rangeCropTop');
    const rangeCropBottom = document.getElementById('rangeCropBottom');
    const rangeCropLeft = document.getElementById('rangeCropLeft');
    const rangeCropRight = document.getElementById('rangeCropRight');

    const valCropTop = document.getElementById('valCropTop');
    const valCropBottom = document.getElementById('valCropBottom');
    const valCropLeft = document.getElementById('valCropLeft');
    const valCropRight = document.getElementById('valCropRight');

    // Free Chop Controls
    const btnFreeChopSquare = document.getElementById('btnFreeChopSquare');
    const btnFreeChopFit = document.getElementById('btnFreeChopFit');
    const btnFreeChopReset = document.getElementById('btnFreeChopReset');
    const badgeFreeChopStatus = document.getElementById('badgeFreeChopStatus');

    // Resize Elements
    const inputResizeWidth = document.getElementById('inputResizeWidth');
    const inputResizeHeight = document.getElementById('inputResizeHeight');
    const btnLockAspect = document.getElementById('btnLockAspect');
    const origDimIndicator = document.getElementById('origDimIndicator');

    // Photo Framing, Zoom & Pan Controls
    const rangeCropZoom = document.getElementById('rangeCropZoom');
    const valCropZoom = document.getElementById('valCropZoom');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnResetZoom = document.getElementById('btnResetZoom');
    const btnFloatingZoomOut = document.getElementById('btnFloatingZoomOut');
    const btnFloatingZoomIn = document.getElementById('btnFloatingZoomIn');
    const btnFloatingZoomReset = document.getElementById('btnFloatingZoomReset');
    const floatingZoomBadge = document.getElementById('floatingZoomBadge');
    const rangeCropPanX = document.getElementById('rangeCropPanX');
    const rangeCropPanY = document.getElementById('rangeCropPanY');
    const valCropPanX = document.getElementById('valCropPanX');
    const valCropPanY = document.getElementById('valCropPanY');
    const btnResetPan = document.getElementById('btnResetPan');
    const btnPanCenterQuick = document.getElementById('btnPanCenterQuick');

    // Text Overlay Elements
    const studioTextInput = document.getElementById('studioTextInput');
    const selectFontFamily = document.getElementById('selectFontFamily');
    const rangeFontSize = document.getElementById('rangeFontSize');
    const valFontSize = document.getElementById('valFontSize');
    const rangeTextOpacity = document.getElementById('rangeTextOpacity');
    const valTextOpacity = document.getElementById('valTextOpacity');
    const inputTextColor = document.getElementById('inputTextColor');
    // Outline elements
    const btnTextOutline = document.getElementById('btnTextOutline');
    const statusTextOutline = document.getElementById('statusTextOutline');
    const outlineBody = document.getElementById('outlineBody');
    const inputOutlineColor = document.getElementById('inputOutlineColor');
    const rangeOutlineWidth = document.getElementById('rangeOutlineWidth');
    const valOutlineWidth = document.getElementById('valOutlineWidth');
    const textStrokeStyleBtns = document.querySelectorAll('.text-stroke-style-btn');
    // Glow elements
    const btnTextGlow = document.getElementById('btnTextGlow');
    const statusTextGlow = document.getElementById('statusTextGlow');
    const glowBody = document.getElementById('glowBody');
    const inputGlowColor = document.getElementById('inputGlowColor');
    const rangeGlowBlur = document.getElementById('rangeGlowBlur');
    const valGlowBlur = document.getElementById('valGlowBlur');
    // Custom color hex badges
    const hexTextColor = document.getElementById('hexTextColor');
    const hexOutlineColor = document.getElementById('hexOutlineColor');
    const hexGlowColor = document.getElementById('hexGlowColor');
    // Style & Position elements
    const btnTextBold = document.getElementById('btnTextBold');
    const btnTextItalic = document.getElementById('btnTextItalic');
    const btnTextUnderline = document.getElementById('btnTextUnderline');
    const btnPosTop = document.getElementById('btnPosTop');
    const btnPosCenter = document.getElementById('btnPosCenter');
    const btnPosBottom = document.getElementById('btnPosBottom');

    // Studio State
    let studioState = {
        mode: 'original', // 'original' or 'result'
        sourceImg: null,
        rotation: 0,      // 0, 90, 180, 270
        flipH: false,
        flipV: false,
        aspectRatio: 'free',
        cropShape: 'rect', // 'rect', 'circle', 'rounded', 'heart', 'star', 'freecut'
        cropMargins: { top: 0, bottom: 0, left: 0, right: 0 },
        freeChop: {
            draggingHandle: null,
            isMovingBox: false,
            isDrawingBox: false,
            dragStart: null,
            initialMargins: null
        },
        cropZoom: 100,           // 10% to 300% (supports zoom out to make image small)
        cropPan: { x: 0, y: 0 }, // -100 to 100 percentage (X: -100=Left, +100=Right; Y: -100=Top, +100=Bottom)
        targetResolution: null,  // { width: 1920, height: 1080 } when active
        activeFilter: 'normal',
        pictureOpacity: 100,     // 5 to 100
        hueRotate: 0,            // -180 to 180 deg
        vignette: 0,      // 0 to 100
        vignetteColor: '#000000',
        edgeBlur: 0,      // 0 to 100
        edgeBlurMode: 'radial', // 'radial' or 'feather'
        brightness: 0,
        contrast: 0,
        saturation: 0,
        extrudeSquare: false, // Stretch whole image into 1:1 square without cutting
        shadow: {
            enabled: false,
            preset: 'soft',
            color: '#000000',
            blur: 20,
            opacity: 60,
            offsetX: 10,
            offsetY: 15
        },
        shapeStroke: {
            enabled: false,
            color: '#ffffff',
            width: 6,
            style: 'solid' // 'solid', 'dashed', 'dotted', 'double'
        },
        freecut: {
            points: [],    // Array of {x, y} normalized (0 to 1) relative to crop box
            isClosed: false,
            mode: 'lasso', // 'lasso' or 'polygon'
            isDrawing: false
        },
        resize: {
            customWidth: 0,
            customHeight: 0,
            hasCustomResize: false,
            lockAspect: true
        },
        text: {
            content: '',
            font: 'sans-serif',
            size: 36,
            color: '#ffffff',
            opacity: 100, // 5 to 100
            bold: true,
            italic: false,
            underline: false,
            outline: true,
            outlineColor: '#000000',
            outlineWidth: 4,
            strokeStyle: 'solid', // 'solid', 'dashed', 'dotted', 'double'
            glow: false,
            glowColor: '#0ea5e9',
            glowBlur: 14,
            x: 0.5,       // relative 0 to 1
            y: 0.85       // relative 0 to 1
        },
        overlay: {
            img: null,
            filename: '',
            size: 35,        // percentage 10 to 100
            x: 0.82,         // normalized center X (default bottom-right)
            y: 0.82,         // normalized center Y
            opacity: 100     // 5 to 100
        },
        isDraggingText: false,
        isDraggingOverlay: false,
        isPanningPhoto: false,
        panStart: { x: 0, y: 0 },
        panInitialState: { x: 0, y: 0 }
    };

    /**
     * Parse hex color string into RGB object
     */
    function hexToRgb(hex) {
        let c = (hex || '#000000').replace('#', '').trim();
        if (c.length === 3) {
            c = c.split('').map(x => x + x).join('');
        }
        const num = parseInt(c, 16) || 0;
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    }

    /**
     * Create shape clipping path on canvas context
     */
    function createShapePath(ctx, shape, x, y, w, h) {
        ctx.beginPath();
        if (shape === 'circle') {
            const rx = w / 2;
            const ry = h / 2;
            ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2);
        } else if (shape === 'rounded') {
            const r = Math.min(w, h) * 0.12;
            if (ctx.roundRect) {
                ctx.roundRect(x, y, w, h, r);
            } else {
                ctx.rect(x, y, w, h);
            }
        } else if (shape === 'heart') {
            const topCurveHeight = h * 0.3;
            ctx.moveTo(x + w / 2, y + h);
            ctx.bezierCurveTo(x, y + h * 0.7, x, y + topCurveHeight, x + w / 4, y + topCurveHeight / 2);
            ctx.bezierCurveTo(x + w / 2, y, x + w / 2, y + topCurveHeight, x + w / 2, y + topCurveHeight);
            ctx.bezierCurveTo(x + w / 2, y + topCurveHeight, x + w / 2, y, x + (3 * w) / 4, y + topCurveHeight / 2);
            ctx.bezierCurveTo(x + w, y + topCurveHeight, x + w, y + h * 0.7, x + w / 2, y + h);
        } else if (shape === 'star') {
            const cx = x + w / 2;
            const cy = y + h / 2;
            const spikes = 5;
            const outerRadius = Math.min(w, h) / 2;
            const innerRadius = outerRadius * 0.45;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;

            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                let px = cx + Math.cos(rot) * outerRadius;
                let py = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(px, py);
                rot += step;

                px = cx + Math.cos(rot) * innerRadius;
                py = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(px, py);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
        } else if (shape === 'freecut') {
            const pts = studioState.freecut.points;
            if (pts && pts.length >= 2) {
                ctx.moveTo(x + pts[0].x * w, y + pts[0].y * h);
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineTo(x + pts[i].x * w, y + pts[i].y * h);
                }
                if (studioState.freecut.isClosed) {
                    ctx.closePath();
                }
            } else {
                ctx.rect(x, y, w, h);
            }
        } else {
            ctx.rect(x, y, w, h);
        }
    }

    /**
     * Calculate 8 Free Chop handles and bounding box
     */
    function getFreeChopHandles(ratioW, ratioH, margins) {
        const mTop = Math.round(ratioH * ((margins.top || 0) / 100));
        const mBottom = Math.round(ratioH * ((margins.bottom || 0) / 100));
        const mLeft = Math.round(ratioW * ((margins.left || 0) / 100));
        const mRight = Math.round(ratioW * ((margins.right || 0) / 100));

        const x = mLeft;
        const y = mTop;
        const w = Math.max(20, ratioW - mLeft - mRight);
        const h = Math.max(20, ratioH - mTop - mBottom);

        return {
            box: { x, y, w, h, mTop, mBottom, mLeft, mRight },
            handles: {
                tl: { x: x, y: y, cursor: 'nwse-resize' },
                t:  { x: x + w / 2, y: y, cursor: 'ns-resize' },
                tr: { x: x + w, y: y, cursor: 'nesw-resize' },
                r:  { x: x + w, y: y + h / 2, cursor: 'ew-resize' },
                br: { x: x + w, y: y + h, cursor: 'nwse-resize' },
                b:  { x: x + w / 2, y: y + h, cursor: 'ns-resize' },
                bl: { x: x, y: y + h, cursor: 'nesw-resize' },
                l:  { x: x, y: y + h / 2, cursor: 'ew-resize' }
            }
        };
    }

    /**
     * Hit test pointer against Free Chop handles and box
     */
    function hitTestFreeChop(canvasX, canvasY, ratioW, ratioH, margins, scaleRatio) {
        const { box, handles } = getFreeChopHandles(ratioW, ratioH, margins);
        const handleRadius = Math.max(16, 14 * scaleRatio);

        // Check 8 handles
        for (const key of ['tl', 'tr', 'br', 'bl', 't', 'r', 'b', 'l']) {
            const h = handles[key];
            if (Math.hypot(canvasX - h.x, canvasY - h.y) <= handleRadius) {
                return { type: 'handle', handle: key, cursor: h.cursor };
            }
        }

        // Check inside box
        if (canvasX >= box.x && canvasX <= box.x + box.w && canvasY >= box.y && canvasY <= box.y + box.h) {
            return { type: 'box', cursor: 'move' };
        }

        // Outside box
        return { type: 'outside', cursor: 'crosshair' };
    }

    /**
     * Reset Studio controls to defaults
     */
    function resetStudioState() {
        studioState.rotation = 0;
        studioState.flipH = false;
        studioState.flipV = false;
        studioState.aspectRatio = 'free';
        studioState.cropShape = 'rect';
        studioState.cropMargins = { top: 0, bottom: 0, left: 0, right: 0 };
        studioState.freeChop = {
            draggingHandle: null,
            isMovingBox: false,
            isDrawingBox: false,
            dragStart: null,
            initialMargins: null
        };
        studioState.cropPan = { x: 0, y: 0 };
        studioState.targetResolution = null;
        studioState.activeFilter = 'normal';
        studioState.pictureOpacity = 100;
        studioState.hueRotate = 0;
        studioState.vignette = 0;
        studioState.vignetteColor = '#000000';
        studioState.edgeBlur = 0;
        studioState.edgeBlurMode = 'radial';
        studioState.brightness = 0;
        studioState.contrast = 0;
        studioState.saturation = 0;
        studioState.extrudeSquare = false;
        studioState.resize.customWidth = 0;
        studioState.resize.customHeight = 0;
        studioState.resize.hasCustomResize = false;
        if (typeof updateExtrudeUI === 'function') updateExtrudeUI();

        // Reset Shadow State & UI
        studioState.shadow = {
            enabled: false,
            preset: 'soft',
            color: '#000000',
            blur: 20,
            opacity: 60,
            offsetX: 10,
            offsetY: 15
        };
        if (btnCutoutShadow) btnCutoutShadow.classList.remove('active');
        if (statusCutoutShadow) statusCutoutShadow.textContent = 'OFF';
        if (cutoutShadowBody) cutoutShadowBody.style.display = 'none';
        if (inputShadowColor) inputShadowColor.value = '#000000';
        if (hexShadowColor) hexShadowColor.textContent = '#000000';
        if (rangeShadowBlur) rangeShadowBlur.value = 20;
        if (valShadowBlur) valShadowBlur.textContent = '20px';
        if (rangeShadowOpacity) rangeShadowOpacity.value = 60;
        if (valShadowOpacity) valShadowOpacity.textContent = '60%';
        if (rangeShadowOffsetX) rangeShadowOffsetX.value = 10;
        if (valShadowOffsetX) valShadowOffsetX.textContent = '+10px';
        if (rangeShadowOffsetY) rangeShadowOffsetY.value = 15;
        if (valShadowOffsetY) valShadowOffsetY.textContent = '+15px';
        document.querySelectorAll('.swatch-shadow').forEach(b => {
            b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === '#000000');
        });
        document.querySelectorAll('.shadow-preset-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.preset === 'soft');
        });

        // Reset Free Cut State & UI
        studioState.freecut = {
            points: [],
            isClosed: false,
            mode: 'lasso',
            isDrawing: false
        };
        if (freeCutToolbar) freeCutToolbar.style.display = 'none';
        if (valFreeCutPoints) valFreeCutPoints.textContent = '0';
        if (btnFreeCutModeLasso) btnFreeCutModeLasso.classList.add('active');
        if (btnFreeCutModePolygon) btnFreeCutModePolygon.classList.remove('active');
        if (studioCanvas) {
            studioCanvas.classList.remove('is-freecutting');
            studioCanvas.classList.remove('is-freecut-drawing');
        }

        // Reset Shape Stroke State & UI
        studioState.shapeStroke = {
            enabled: false,
            color: '#ffffff',
            width: 6,
            style: 'solid'
        };
        if (btnShapeStroke) btnShapeStroke.classList.remove('active');
        if (statusShapeStroke) statusShapeStroke.textContent = 'OFF';
        if (shapeStrokeBody) shapeStrokeBody.style.display = 'none';
        if (inputShapeStrokeColor) inputShapeStrokeColor.value = '#ffffff';
        if (hexShapeStrokeColor) hexShapeStrokeColor.textContent = '#ffffff';
        if (rangeShapeStrokeWidth) rangeShapeStrokeWidth.value = 6;
        if (valShapeStrokeWidth) valShapeStrokeWidth.textContent = '6px';
        document.querySelectorAll('.shape-stroke-style-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.style === 'solid');
        });
        document.querySelectorAll('.swatch-shape-stroke').forEach(b => {
            b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === '#ffffff');
        });

        // Reset Picture Opacity & Hue Sliders
        if (rangePictureOpacity) rangePictureOpacity.value = 100;
        if (valPictureOpacity) valPictureOpacity.textContent = '100%';
        document.querySelectorAll('.pic-op-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.opacity === '100');
        });
        if (rangeHueRotate) rangeHueRotate.value = 0;
        if (valHueRotate) valHueRotate.textContent = '0°';

        studioState.text.content = '';
        studioState.text.font = 'sans-serif';
        studioState.text.size = 36;
        studioState.text.color = '#ffffff';
        studioState.text.opacity = 100;
        studioState.text.bold = true;
        studioState.text.italic = false;
        studioState.text.underline = false;
        studioState.text.outline = true;
        studioState.text.outlineColor = '#000000';
        studioState.text.outlineWidth = 4;
        studioState.text.strokeStyle = 'solid';
        studioState.text.glow = false;
        studioState.text.glowColor = '#38bdf8';
        studioState.text.glowBlur = 14;
        studioState.text.x = 0.5;
        studioState.text.y = 0.85;

        // Sliders & Readouts
        if (rangeBrightness) rangeBrightness.value = 0;
        if (rangeContrast) rangeContrast.value = 0;
        if (rangeSaturation) rangeSaturation.value = 0;
        if (rangeVignette) rangeVignette.value = 0;
        if (valBrightness) valBrightness.textContent = '0%';
        if (valContrast) valContrast.textContent = '0%';
        if (valSaturation) valSaturation.textContent = '0%';
        if (valVignette) valVignette.textContent = '0%';
        if (inputVignetteColor) inputVignetteColor.value = '#000000';
        if (hexVignetteColor) hexVignetteColor.textContent = '#000000';
        document.querySelectorAll('.swatch-vignette').forEach(b => {
            b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === '#000000');
        });

        const rangeEdgeBlur = document.getElementById('rangeEdgeBlur');
        const valEdgeBlur = document.getElementById('valEdgeBlur');
        const btnEdgeBlurRadial = document.getElementById('btnEdgeBlurRadial');
        const btnEdgeBlurFeather = document.getElementById('btnEdgeBlurFeather');
        if (rangeEdgeBlur) rangeEdgeBlur.value = 0;
        if (valEdgeBlur) valEdgeBlur.textContent = '0%';
        if (btnEdgeBlurRadial) btnEdgeBlurRadial.classList.add('active');
        if (btnEdgeBlurFeather) btnEdgeBlurFeather.classList.remove('active');
        document.querySelectorAll('.edge-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.val === '0');
        });

        if (rangeCropTop) rangeCropTop.value = 0;
        if (rangeCropBottom) rangeCropBottom.value = 0;
        if (rangeCropLeft) rangeCropLeft.value = 0;
        if (rangeCropRight) rangeCropRight.value = 0;
        if (valCropTop) valCropTop.textContent = '0%';
        if (valCropBottom) valCropBottom.textContent = '0%';
        if (valCropLeft) valCropLeft.textContent = '0%';
        if (valCropRight) valCropRight.textContent = '0%';

        // Framing, Zoom & Pan Controls
        studioState.cropZoom = 100;
        studioState.cropPan = { x: 0, y: 0 };
        studioState.targetResolution = null;
        if (rangeCropZoom) rangeCropZoom.value = 100;
        if (valCropZoom) valCropZoom.textContent = '100%';
        if (floatingZoomBadge) floatingZoomBadge.textContent = '100%';
        document.querySelectorAll('.zoom-pill-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.zoom === '100');
        });
        if (rangeCropPanX) rangeCropPanX.value = 0;
        if (valCropPanX) valCropPanX.textContent = '0%';
        if (rangeCropPanY) rangeCropPanY.value = 0;
        if (valCropPanY) valCropPanY.textContent = '0%';
        document.querySelectorAll('.pan-quick-btn').forEach(b => {
            const bx = parseInt(b.dataset.panX, 10);
            const by = parseInt(b.dataset.panY, 10);
            b.classList.toggle('active', bx === 0 && by === 0);
        });
        document.querySelectorAll('.res-preset-btn').forEach(b => b.classList.remove('active'));

        // Resize Inputs & Dimensions
        studioState.resize.customWidth = 0;
        studioState.resize.customHeight = 0;
        studioState.resize.hasCustomResize = false;

        if (studioState.sourceImg) {
            const w = studioState.sourceImg.naturalWidth || studioState.sourceImg.width;
            const h = studioState.sourceImg.naturalHeight || studioState.sourceImg.height;
            if (inputResizeWidth) {
                inputResizeWidth.value = w;
                inputResizeWidth.dataset.baseW = w;
            }
            if (inputResizeHeight) {
                inputResizeHeight.value = h;
                inputResizeHeight.dataset.baseH = h;
            }
            if (origDimIndicator) origDimIndicator.textContent = `${w} × ${h} px`;
        }

        // Text Inputs & Effects
        if (studioTextInput) studioTextInput.value = '';
        if (selectFontFamily) selectFontFamily.value = 'sans-serif';
        if (rangeFontSize) rangeFontSize.value = 36;
        if (valFontSize) valFontSize.textContent = '36px';
        if (rangeTextOpacity) rangeTextOpacity.value = 100;
        if (valTextOpacity) valTextOpacity.textContent = '100%';
        document.querySelectorAll('.text-op-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.opacity === '100');
        });
        if (inputTextColor) inputTextColor.value = '#ffffff';
        if (btnTextBold) btnTextBold.classList.add('active');
        if (btnTextItalic) btnTextItalic.classList.remove('active');
        if (btnTextUnderline) btnTextUnderline.classList.remove('active');

        // Reset Outline UI
        if (btnTextOutline) btnTextOutline.classList.add('active');
        if (statusTextOutline) statusTextOutline.textContent = 'ON';
        if (outlineBody) outlineBody.style.display = 'flex';
        if (inputOutlineColor) inputOutlineColor.value = '#000000';
        if (rangeOutlineWidth) rangeOutlineWidth.value = 4;
        if (valOutlineWidth) valOutlineWidth.textContent = '4px';
        document.querySelectorAll('.text-stroke-style-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.style === 'solid');
        });

        // Reset Glow UI
        if (btnTextGlow) btnTextGlow.classList.remove('active');
        if (statusTextGlow) statusTextGlow.textContent = 'OFF';
        if (glowBody) glowBody.style.display = 'none';
        if (inputGlowColor) inputGlowColor.value = '#0ea5e9';
        if (rangeGlowBlur) rangeGlowBlur.value = 14;
        if (valGlowBlur) valGlowBlur.textContent = '14px';
        studioState.text.glowColor = '#0ea5e9';

        // Hex Badges
        if (hexTextColor) hexTextColor.textContent = '#ffffff';
        if (hexOutlineColor) hexOutlineColor.textContent = '#000000';
        if (hexGlowColor) hexGlowColor.textContent = '#0ea5e9';

        // Button states
        document.querySelectorAll('.ratio-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === 'free');
        });
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.shape === 'rect');
        });
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.filter === 'normal');
        });
        document.querySelectorAll('.scale-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scale === '1.0');
        });
        document.querySelectorAll('.swatch-word').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color.toLowerCase() === '#ffffff');
        });
        document.querySelectorAll('.swatch-outline').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color.toLowerCase() === '#000000');
        });
        document.querySelectorAll('.swatch-glow').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color.toLowerCase() === '#0ea5e9');
        });
        if (btnLockAspect) btnLockAspect.classList.add('active');

        // Overlay State & Controls Reset
        studioState.overlay = {
            img: null,
            filename: '',
            size: 35,
            x: 0.82,
            y: 0.82,
            opacity: 100
        };
        const inputOverlayFile = document.getElementById('inputOverlayFile');
        if (inputOverlayFile) inputOverlayFile.value = '';
        const overlayEmptyState = document.getElementById('overlayEmptyState');
        const overlayLoadedState = document.getElementById('overlayLoadedState');
        const overlayControlsPanel = document.getElementById('overlayControlsPanel');
        if (overlayEmptyState) overlayEmptyState.style.display = 'flex';
        if (overlayLoadedState) overlayLoadedState.style.display = 'none';
        if (overlayControlsPanel) overlayControlsPanel.style.display = 'none';
        const rangeOverlaySize = document.getElementById('rangeOverlaySize');
        const valOverlaySize = document.getElementById('valOverlaySize');
        if (rangeOverlaySize) rangeOverlaySize.value = 35;
        if (valOverlaySize) valOverlaySize.textContent = '35%';
        const rangeOverlayOpacity = document.getElementById('rangeOverlayOpacity');
        const valOverlayOpacity = document.getElementById('valOverlayOpacity');
        if (rangeOverlayOpacity) rangeOverlayOpacity.value = 100;
        if (valOverlayOpacity) valOverlayOpacity.textContent = '100%';
        const rangeOverlayPosX = document.getElementById('rangeOverlayPosX');
        const valOverlayPosX = document.getElementById('valOverlayPosX');
        if (rangeOverlayPosX) rangeOverlayPosX.value = 82;
        if (valOverlayPosX) valOverlayPosX.textContent = '82%';
        const rangeOverlayPosY = document.getElementById('rangeOverlayPosY');
        const valOverlayPosY = document.getElementById('valOverlayPosY');
        if (rangeOverlayPosY) rangeOverlayPosY.value = 82;
        if (valOverlayPosY) valOverlayPosY.textContent = '82%';
        document.querySelectorAll('.overlay-size-btn').forEach(b => b.classList.toggle('active', b.dataset.size === '35'));
        document.querySelectorAll('.overlay-op-btn').forEach(b => b.classList.toggle('active', b.dataset.opacity === '100'));
        document.querySelectorAll('.overlay-align-btn').forEach(b => b.classList.toggle('active', b.dataset.align === 'br'));

        if (typeof switchStudioCategory === 'function') switchStudioCategory('core');
    }

    /**
     * Open Image Studio with specified image source and mode
     */
    function openImageStudio(imageSrc, mode) {
        if (!imageSrc) return;

        studioState.mode = mode;
        studioState.cutoutType = (mode === 'result') ? activeCutoutMode : 'original';

        // Display or hide invert cutout button in Studio
        if (btnStudioInvertCutout) {
            btnStudioInvertCutout.style.display = (mode === 'result' || cachedBgUrl) ? 'inline-flex' : 'none';
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            studioState.sourceImg = img;
            resetStudioState();
            if (studioModal) studioModal.classList.add('show');
            renderStudioCanvas();
        };
        img.src = imageSrc;
    }

    // Invert Cutout (Inside ⇄ Outside) inside Image Studio
    if (btnStudioInvertCutout) {
        btnStudioInvertCutout.addEventListener('click', async () => {
            if (!studioState.sourceImg) return;

            let nextMode = (studioState.cutoutType === 'inside') ? 'bg' : 'inside';
            let nextSrc = (nextMode === 'bg') ? cachedBgUrl : cachedInsideDataUrl;

            if (!nextSrc && nextMode === 'inside' && selectedDataUrl && cachedBgUrl) {
                nextSrc = await generateInsideCutoutDataUrl(selectedDataUrl, cachedBgUrl);
            }

            if (!nextSrc && activeResultId) {
                nextSrc = `api/download.php?id=${encodeURIComponent(activeResultId)}&mode=${nextMode}&preview=1`;
            }

            if (nextSrc) {
                const newImg = new Image();
                newImg.crossOrigin = 'anonymous';
                newImg.onload = () => {
                    studioState.sourceImg = newImg;
                    studioState.cutoutType = nextMode;
                    renderStudioCanvas();
                };
                newImg.src = nextSrc;
            }
        });
    }

    /**
     * Close Image Studio modal
     */
    function closeImageStudio() {
        if (studioModal) studioModal.classList.remove('show');
    }

    /**
     * Build CSS filter string for canvas 2D context
     */
    function getFilterString() {
        const b = 100 + parseInt(studioState.brightness, 10);
        const c = 100 + parseInt(studioState.contrast, 10);
        const s = 100 + parseInt(studioState.saturation, 10);

        let baseFilters = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

        switch (studioState.activeFilter) {
            case 'vivid':
                baseFilters += ' saturate(160%) contrast(110%)';
                break;
            case 'bw':
                baseFilters += ' grayscale(100%)';
                break;
            case 'sepia':
                baseFilters += ' sepia(90%) contrast(95%)';
                break;
            case 'vintage':
                baseFilters += ' sepia(45%) contrast(120%) brightness(95%)';
                break;
            case 'warm':
                baseFilters += ' sepia(25%) saturate(135%) hue-rotate(-10deg)';
                break;
            case 'cool':
                baseFilters += ' hue-rotate(25deg) saturate(110%)';
                break;
            case 'contrast':
                baseFilters += ' contrast(145%) brightness(105%)';
                break;
            case 'cyberpunk':
                baseFilters += ' saturate(220%) contrast(130%) hue-rotate(190deg)';
                break;
            case 'noir':
                baseFilters += ' grayscale(100%) contrast(180%) brightness(90%)';
                break;
            case 'golden':
                baseFilters += ' sepia(40%) saturate(180%) hue-rotate(-20deg) brightness(105%)';
                break;
            case 'cinema':
                baseFilters += ' contrast(130%) saturate(140%) hue-rotate(-15deg)';
                break;
            case 'pastel':
                baseFilters += ' brightness(112%) saturate(85%) contrast(92%)';
                break;
            case 'retro':
                baseFilters += ' sepia(25%) contrast(115%) saturate(120%) brightness(105%)';
                break;
            case 'emerald':
                baseFilters += ' hue-rotate(65deg) saturate(130%) contrast(110%)';
                break;
            case 'lilac':
                baseFilters += ' hue-rotate(240deg) saturate(135%) contrast(105%)';
                break;
            case 'invert':
                baseFilters += ' invert(100%)';
                break;
            case 'popart':
                baseFilters += ' contrast(160%) saturate(200%) hue-rotate(90deg)';
                break;
            case 'nordic':
                baseFilters += ' saturate(60%) hue-rotate(180deg) brightness(105%)';
                break;
            case 'vignette':
                baseFilters += ' contrast(115%)';
                break;
            default:
                break;
        }

        if (studioState.hueRotate && studioState.hueRotate !== 0) {
            baseFilters += ` hue-rotate(${studioState.hueRotate}deg)`;
        }

        return baseFilters;
    }

    /**
     * Render the transformed, cropped, shaped, and filtered image onto the canvas
     */
    function renderStudioCanvas(options = {}) {
        if (!studioState.sourceImg || !studioCanvas) return;

        const img = studioState.sourceImg;
        const ctx = studioCanvas.getContext('2d');
        if (!ctx) return;

        const activeTabContent = document.querySelector('.studio-tab-content.active');

        // Base image dimensions
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Rotated dimensions
        const isSideways = studioState.rotation === 90 || studioState.rotation === 270;
        const rotW = isSideways ? origH : origW;
        const rotH = isSideways ? origW : origH;

        // Determine aspect ratio / extrude crop dimensions
        let ratioW = rotW;
        let ratioH = rotH;

        if (studioState.extrudeSquare) {
            // EXTRUDE TO SQUARE:
            // Forces entire picture into 1:1 square without cutting any edges!
            const sqSize = Math.max(rotW, rotH);
            ratioW = sqSize;
            ratioH = sqSize;
        } else if (studioState.aspectRatio !== 'free') {
            let targetRatio = 1;
            if (studioState.aspectRatio === '1920:1080') {
                targetRatio = 1920 / 1080;
            } else {
                const parts = studioState.aspectRatio.split(':').map(Number);
                targetRatio = parts[0] / parts[1];
            }
            const currentRatio = rotW / rotH;

            if (currentRatio > targetRatio) {
                ratioH = rotH;
                ratioW = Math.round(rotH * targetRatio);
            } else {
                ratioW = rotW;
                ratioH = Math.round(rotW / targetRatio);
            }
        }

        // Apply Freeform Chop Margins (0% to 45% each)
        const mTop = Math.round(ratioH * (studioState.cropMargins.top / 100));
        const mBottom = Math.round(ratioH * (studioState.cropMargins.bottom / 100));
        const mLeft = Math.round(ratioW * (studioState.cropMargins.left / 100));
        const mRight = Math.round(ratioW * (studioState.cropMargins.right / 100));

        const croppedW = Math.max(30, ratioW - mLeft - mRight);
        const croppedH = Math.max(30, ratioH - mTop - mBottom);

        // Photo Zoom multiplier (0.1 to 3.0, supports zoom out / shrink)
        const zoom = Math.max(0.1, Math.min(3.0, (studioState.cropZoom || 100) / 100));
        const drawW = Math.round((isSideways ? origH : origW) * zoom);
        const drawH = Math.round((isSideways ? origW : origH) * zoom);

        // Calculate framing pan slack (how much the image extends outside the crop window)
        const availSlackX = Math.max(0, (drawW - croppedW) / 2);
        const availSlackY = Math.max(0, (drawH - croppedH) / 2);

        // Effective slack: if there is slack, stay strictly within the photo boundaries; if no slack, allow soft framing offset
        const effectiveSlackX = availSlackX > 0 ? availSlackX : Math.round(croppedW * 0.4);
        const effectiveSlackY = availSlackY > 0 ? availSlackY : Math.round(croppedH * 0.4);

        // Framing translation:
        // panX = -100 (Left) -> shift image right (+effectiveSlackX) to show the LEFT side of the photo
        // panX = +100 (Right) -> shift image left (-effectiveSlackX) to show the RIGHT side of the photo
        const panPixelX = - (studioState.cropPan.x / 100) * effectiveSlackX;

        // panY = -100 (Top) -> shift image down (+effectiveSlackY) to show the TOP side of the photo
        // panY = +100 (Bottom) -> shift image up (-effectiveSlackY) to show the BOTTOM side of the photo
        const panPixelY = - (studioState.cropPan.y / 100) * effectiveSlackY;

        // Determine Final Target Dimensions:
        // CROP / CHOP ONLY CUTS THE PICTURE (NEVER EXTRUDES OR STRETCHES IT).
        // Final canvas dimensions match the cropped size 1:1 unless the user explicitly used the Resize tool or selected 1920x1080.
        let finalW = croppedW;
        let finalH = croppedH;

        if (studioState.resize.hasCustomResize && studioState.resize.customWidth > 20 && studioState.resize.customHeight > 20) {
            finalW = studioState.resize.customWidth;
            finalH = studioState.resize.customHeight;
            if (origDimIndicator) {
                origDimIndicator.textContent = `${croppedW} × ${croppedH} px → ${finalW} × ${finalH} px`;
            }
        } else if (studioState.aspectRatio === '1920:1080' || studioState.targetResolution) {
            finalW = studioState.targetResolution ? studioState.targetResolution.width : 1920;
            finalH = studioState.targetResolution ? studioState.targetResolution.height : 1080;
            if (inputResizeWidth) {
                inputResizeWidth.value = finalW;
                inputResizeWidth.dataset.baseW = croppedW;
            }
            if (inputResizeHeight) {
                inputResizeHeight.value = finalH;
                inputResizeHeight.dataset.baseH = croppedH;
            }
            if (origDimIndicator) {
                origDimIndicator.textContent = `${croppedW} × ${croppedH} px → ${finalW} × ${finalH} px (1920×1080 FHD)`;
            }
        } else {
            if (inputResizeWidth) {
                inputResizeWidth.value = croppedW;
                inputResizeWidth.dataset.baseW = croppedW;
            }
            if (inputResizeHeight) {
                inputResizeHeight.value = croppedH;
                inputResizeHeight.dataset.baseH = croppedH;
            }
            if (origDimIndicator) {
                origDimIndicator.textContent = studioState.extrudeSquare 
                    ? `${rotW} × ${rotH} px → ${croppedW} × ${croppedH} px (1:1 Extrude)`
                    : `${croppedW} × ${croppedH} px`;
            }
        }

        // Step 1: Render intermediate unscaled cropped image to content canvas
        const contentCanvas = document.createElement('canvas');
        contentCanvas.width = croppedW;
        contentCanvas.height = croppedH;
        const contentCtx = contentCanvas.getContext('2d');
        if (!contentCtx) return;

        contentCtx.clearRect(0, 0, croppedW, croppedH);

        // Clip to Shape Mask if selected
        if (studioState.cropShape !== 'rect') {
            createShapePath(contentCtx, studioState.cropShape, 0, 0, croppedW, croppedH);
            contentCtx.clip();
        }

        // Apply Color Filters, Transparency & Smoothing
        contentCtx.filter = getFilterString();
        contentCtx.globalAlpha = Math.max(0.05, Math.min(1.0, (studioState.pictureOpacity ?? 100) / 100));
        contentCtx.imageSmoothingEnabled = true;
        contentCtx.imageSmoothingQuality = 'high';

        // Draw Transformed Image with Center Alignment + User Framing Pan
        contentCtx.save();
        contentCtx.translate(
            croppedW / 2 + (mRight - mLeft) / 2 + panPixelX,
            croppedH / 2 + (mBottom - mTop) / 2 + panPixelY
        );
        contentCtx.rotate((studioState.rotation * Math.PI) / 180);

        const scaleX = studioState.flipH ? -1 : 1;
        const scaleY = studioState.flipV ? -1 : 1;
        contentCtx.scale(scaleX, scaleY);

        if (studioState.extrudeSquare) {
            // Extrude entire picture into square dimensions (zoom applied)
            const baseW = isSideways ? ratioH : ratioW;
            const baseH = isSideways ? ratioW : ratioH;
            const drawW = Math.round(baseW * zoom);
            const drawH = Math.round(baseH * zoom);
            contentCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            // Draw image with zoom scaling applied
            const unzoomedW = Math.round(origW * zoom);
            const unzoomedH = Math.round(origH * zoom);
            contentCtx.drawImage(img, -unzoomedW / 2, -unzoomedH / 2, unzoomedW, unzoomedH);
        }
        contentCtx.restore();

        // Step 1.2: Draw Cutout & Shape Border Stroke if enabled
        if (studioState.shapeStroke && studioState.shapeStroke.enabled) {
            contentCtx.save();
            contentCtx.strokeStyle = studioState.shapeStroke.color || '#ffffff';
            const strokeW = Math.max(1, Math.round((studioState.shapeStroke.width || 6) * (croppedW / 600)));
            contentCtx.lineWidth = strokeW;
            contentCtx.lineJoin = 'round';
            contentCtx.lineCap = 'round';

            const sStyle = studioState.shapeStroke.style || 'solid';
            if (sStyle === 'dashed') {
                contentCtx.setLineDash([strokeW * 2.5, strokeW * 1.5]);
            } else if (sStyle === 'dotted') {
                contentCtx.setLineDash([1, strokeW * 1.8]);
            } else {
                contentCtx.setLineDash([]);
            }

            createShapePath(contentCtx, studioState.cropShape, 0, 0, croppedW, croppedH);
            contentCtx.stroke();

            if (sStyle === 'double') {
                contentCtx.lineWidth = Math.max(1, Math.round(strokeW * 0.4));
                const offset = strokeW * 1.4;
                createShapePath(contentCtx, studioState.cropShape, offset, offset, Math.max(1, croppedW - offset * 2), Math.max(1, croppedH - offset * 2));
                contentCtx.stroke();
            }
            contentCtx.restore();
        }

        // Step 1.3: Render to offCanvas with Drop Shadow if active
        const offCanvas = document.createElement('canvas');
        offCanvas.width = croppedW;
        offCanvas.height = croppedH;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        offCtx.clearRect(0, 0, croppedW, croppedH);

        if (studioState.shadow && studioState.shadow.enabled) {
            offCtx.save();
            const sColor = hexToRgb(studioState.shadow.color || '#000000');
            const sAlpha = Math.max(0.05, Math.min(1.0, (studioState.shadow.opacity || 60) / 100));
            offCtx.shadowColor = `rgba(${sColor.r}, ${sColor.g}, ${sColor.b}, ${sAlpha})`;
            const scaleF = croppedW / 600;
            offCtx.shadowBlur = Math.max(0, Math.round(studioState.shadow.blur * scaleF));
            offCtx.shadowOffsetX = Math.round(studioState.shadow.offsetX * scaleF);
            offCtx.shadowOffsetY = Math.round(studioState.shadow.offsetY * scaleF);
            offCtx.drawImage(contentCanvas, 0, 0);
            offCtx.restore();
        } else {
            offCtx.drawImage(contentCanvas, 0, 0);
        }

        // Step 1.4: Live Free Cut Path Guide & Control Points (shown when Free Cut tab is active)
        if (activeTabContent && activeTabContent.id === 'tabContentChopFree' && studioState.cropShape === 'freecut' && studioState.freecut.points.length > 0) {
            offCtx.save();
            const pts = studioState.freecut.points;
            offCtx.strokeStyle = '#38bdf8';
            offCtx.lineWidth = Math.max(2, Math.round(croppedW / 300));
            offCtx.setLineDash([6, 4]);
            offCtx.beginPath();
            offCtx.moveTo(pts[0].x * croppedW, pts[0].y * croppedH);
            for (let i = 1; i < pts.length; i++) {
                offCtx.lineTo(pts[i].x * croppedW, pts[i].y * croppedH);
            }
            if (studioState.freecut.isClosed) {
                offCtx.closePath();
            }
            offCtx.stroke();

            // Point dots
            offCtx.setLineDash([]);
            const dotR = Math.max(3.5, Math.round(croppedW / 180));
            for (let i = 0; i < pts.length; i++) {
                offCtx.beginPath();
                offCtx.arc(pts[i].x * croppedW, pts[i].y * croppedH, i === 0 ? dotR * 1.4 : dotR, 0, Math.PI * 2);
                offCtx.fillStyle = i === 0 ? '#ec4899' : '#38bdf8';
                offCtx.fill();
                offCtx.strokeStyle = '#ffffff';
                offCtx.lineWidth = 1.5;
                offCtx.stroke();
            }
            offCtx.restore();
        }

        // Step 1.5: Draw Edge Blurring if active
        if (studioState.edgeBlur > 0) {
            if (studioState.edgeBlurMode === 'radial') {
                // Perimeter Lens Blur: leaves center sharp, blurs outer edges & corners with authentic camera bokeh
                const maxBlurPx = Math.max(16, Math.round(Math.min(croppedW, croppedH) * 0.18));
                const blurPx = Math.max(2, Math.round((studioState.edgeBlur / 100) * maxBlurPx));

                const blurCanvas = document.createElement('canvas');
                blurCanvas.width = croppedW;
                blurCanvas.height = croppedH;
                const blurCtx = blurCanvas.getContext('2d');
                if (blurCtx) {
                    blurCtx.filter = `blur(${blurPx}px)`;
                    blurCtx.drawImage(offCanvas, 0, 0);

                    // Radial gradient mask: 0 (transparent) in center, 1 (opaque) at outer edges
                    const maskCanvas = document.createElement('canvas');
                    maskCanvas.width = croppedW;
                    maskCanvas.height = croppedH;
                    const maskCtx = maskCanvas.getContext('2d');
                    if (maskCtx) {
                        const cx = croppedW / 2;
                        const cy = croppedH / 2;
                        const cornerDist = Math.hypot(cx, cy);
                        const minHalf = Math.min(cx, cy);
                        // Focal center circle stays crisp, smoothly transitioning outward
                        const innerR = minHalf * Math.max(0.12, 0.50 - (studioState.edgeBlur / 100) * 0.32);
                        const outerR = minHalf + (cornerDist - minHalf) * 0.60;
                        const grad = maskCtx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
                        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                        grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.15)');
                        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
                        grad.addColorStop(1, 'rgba(0, 0, 0, 1.0)');

                        maskCtx.fillStyle = grad;
                        maskCtx.fillRect(0, 0, croppedW, croppedH);

                        blurCtx.globalCompositeOperation = 'destination-in';
                        blurCtx.drawImage(maskCanvas, 0, 0);

                        offCtx.save();
                        if (studioState.cropShape !== 'rect') {
                            createShapePath(offCtx, studioState.cropShape, 0, 0, croppedW, croppedH);
                            offCtx.clip();
                        }
                        offCtx.drawImage(blurCanvas, 0, 0);
                        offCtx.restore();
                    }
                }
            } else if (studioState.edgeBlurMode === 'feather') {
                // Soft Border Feather: smoothly softens/feathers outer boundaries
                offCtx.save();
                offCtx.globalCompositeOperation = 'destination-in';
                const cx = croppedW / 2;
                const cy = croppedH / 2;
                const radius = Math.max(croppedW, croppedH) * 0.72;
                const featherInner = radius * Math.max(0.15, 1 - (studioState.edgeBlur / 100) * 0.55);
                const fGrad = offCtx.createRadialGradient(cx, cy, featherInner, cx, cy, radius);
                fGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
                fGrad.addColorStop(0.75, `rgba(0, 0, 0, ${Math.max(0, 1 - (studioState.edgeBlur / 100) * 0.65)})`);
                fGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                offCtx.fillStyle = fGrad;
                offCtx.fillRect(0, 0, croppedW, croppedH);
                offCtx.restore();
            }
        }

        // Step 2: Draw Vignette (Edge Shading) if active
        if (studioState.vignette > 0) {
            offCtx.save();
            if (studioState.cropShape !== 'rect') {
                createShapePath(offCtx, studioState.cropShape, 0, 0, croppedW, croppedH);
                offCtx.clip();
            }
            const cx = croppedW / 2;
            const cy = croppedH / 2;
            const cornerDist = Math.hypot(cx, cy);
            const minHalf = Math.min(cx, cy);
            const radius = minHalf + (cornerDist - minHalf) * 0.85;
            const innerR = radius * Math.max(0.12, 0.45 - (studioState.vignette / 300));
            const grad = offCtx.createRadialGradient(cx, cy, innerR, cx, cy, radius);

            const vColor = hexToRgb(studioState.vignetteColor || '#000000');
            const rgbStr = `${vColor.r}, ${vColor.g}, ${vColor.b}`;
            const alpha = Math.min(1.0, (studioState.vignette / 100) * 0.95);
            grad.addColorStop(0, `rgba(${rgbStr}, 0)`);
            grad.addColorStop(0.5, `rgba(${rgbStr}, ${(alpha * 0.35).toFixed(3)})`);
            grad.addColorStop(0.85, `rgba(${rgbStr}, ${(alpha * 0.78).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${rgbStr}, ${alpha.toFixed(3)})`);

            offCtx.fillStyle = grad;
            offCtx.fillRect(0, 0, croppedW, croppedH);
            offCtx.restore();
        }

        // Step 3: Draw Text Overlay if present
        if (studioState.text.content.trim().length > 0) {
            offCtx.save();
            const textAlpha = Math.max(0.05, Math.min(1.0, (studioState.text.opacity ?? 100) / 100));
            offCtx.globalAlpha = textAlpha;
            const textX = croppedW * studioState.text.x;
            const textY = croppedH * studioState.text.y;
            const fontSize = Math.max(12, Math.round(studioState.text.size * (croppedW / 600)));

            const fontStyle = `${studioState.text.italic ? 'italic ' : ''}${studioState.text.bold ? 'bold ' : ''}${fontSize}px ${studioState.text.font}`;
            offCtx.font = fontStyle;
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';

            // 1. Draw Glow if active (rendered behind outline and text fill)
            if (studioState.text.glow) {
                offCtx.save();
                const glowBlur = Math.max(2, Math.round(studioState.text.glowBlur * (croppedW / 600)));
                offCtx.shadowColor = studioState.text.glowColor;
                offCtx.shadowBlur = glowBlur;
                offCtx.shadowOffsetX = 0;
                offCtx.shadowOffsetY = 0;
                offCtx.fillStyle = studioState.text.glowColor;
                // Double pass gives an authentic, vibrant neon bloom
                offCtx.fillText(studioState.text.content, textX, textY);
                offCtx.fillText(studioState.text.content, textX, textY);
                offCtx.restore();
            }

            // 2. Draw Outline if active (crisp outer stroke with stroke style)
            if (studioState.text.outline) {
                offCtx.save();
                offCtx.shadowColor = 'transparent';
                offCtx.strokeStyle = studioState.text.outlineColor;
                const strokeW = Math.max(1, Math.round(studioState.text.outlineWidth * (croppedW / 600)));
                offCtx.lineWidth = strokeW;
                offCtx.lineJoin = 'round';
                offCtx.miterLimit = 2;

                const tStyle = studioState.text.strokeStyle || 'solid';
                if (tStyle === 'dashed') {
                    offCtx.setLineDash([strokeW * 2.2, strokeW * 1.5]);
                } else if (tStyle === 'dotted') {
                    offCtx.setLineDash([1, strokeW * 1.8]);
                    offCtx.lineCap = 'round';
                } else {
                    offCtx.setLineDash([]);
                }

                if (tStyle === 'double') {
                    offCtx.lineWidth = strokeW * 1.6;
                    offCtx.strokeText(studioState.text.content, textX, textY);
                    offCtx.lineWidth = Math.max(1, strokeW * 0.5);
                    offCtx.strokeStyle = '#ffffff';
                    offCtx.strokeText(studioState.text.content, textX, textY);
                } else {
                    offCtx.strokeText(studioState.text.content, textX, textY);
                }
                offCtx.restore();
            }

            // 3. Fill Text with user's chosen word color
            offCtx.fillStyle = studioState.text.color;
            offCtx.fillText(studioState.text.content, textX, textY);

            // 4. Draw Underline if active
            if (studioState.text.underline) {
                offCtx.save();
                const metrics = offCtx.measureText(studioState.text.content);
                const textW = metrics.width;
                const underlineY = textY + fontSize * 0.52;
                const underlineThickness = Math.max(2, Math.round(fontSize * 0.08));

                offCtx.strokeStyle = studioState.text.color;
                offCtx.lineWidth = underlineThickness;
                offCtx.lineCap = 'round';

                const tStyle = studioState.text.strokeStyle || 'solid';
                if (tStyle === 'dashed') {
                    offCtx.setLineDash([underlineThickness * 2.5, underlineThickness * 1.5]);
                } else if (tStyle === 'dotted') {
                    offCtx.setLineDash([1, underlineThickness * 1.8]);
                } else {
                    offCtx.setLineDash([]);
                }

                offCtx.beginPath();
                offCtx.moveTo(textX - textW / 2, underlineY);
                offCtx.lineTo(textX + textW / 2, underlineY);
                offCtx.stroke();
                offCtx.restore();
            }

            offCtx.restore();
        }

        // Step 3.5: Draw Overlay Image if loaded
        if (studioState.overlay.img) {
            const oImg = studioState.overlay.img;
            const oW = oImg.naturalWidth || oImg.width;
            const oH = oImg.naturalHeight || oImg.height;
            const oAspect = (oW && oH) ? (oW / oH) : 1;
            const overlayW = Math.round(croppedW * (studioState.overlay.size / 100));
            const overlayH = Math.round(overlayW / oAspect);
            const overlayX = Math.round(croppedW * studioState.overlay.x - overlayW / 2);
            const overlayY = Math.round(croppedH * studioState.overlay.y - overlayH / 2);

            offCtx.save();
            if (studioState.cropShape !== 'rect') {
                createShapePath(offCtx, studioState.cropShape, 0, 0, croppedW, croppedH);
                offCtx.clip();
            }
            offCtx.globalAlpha = Math.max(0.05, Math.min(1.0, studioState.overlay.opacity / 100));
            offCtx.drawImage(oImg, overlayX, overlayY, overlayW, overlayH);
            offCtx.restore();
        }

        // Step 4: Transfer to Main Studio Canvas (Interactive Free Chop vs Final Cropped)
        const isExport = !!(options && options.exportMode);
        const isChopFreeTab = activeTabContent && activeTabContent.id === 'tabContentChopFree';
        const isFreeChopView = !isExport && isChopFreeTab && studioState.cropShape !== 'freecut';

        if (isFreeChopView) {
            studioCanvas.width = ratioW;
            studioCanvas.height = ratioH;

            ctx.clearRect(0, 0, ratioW, ratioH);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 1. Draw full oriented photo in the background (dimmed)
            ctx.save();
            ctx.translate(ratioW / 2 + panPixelX, ratioH / 2 + panPixelY);
            ctx.rotate((studioState.rotation * Math.PI) / 180);
            ctx.scale(studioState.flipH ? -1 : 1, studioState.flipV ? -1 : 1);
            if (studioState.extrudeSquare) {
                const baseW = isSideways ? ratioH : ratioW;
                const baseH = isSideways ? ratioW : ratioH;
                const drawW = Math.round(baseW * zoom);
                const drawH = Math.round(baseH * zoom);
                ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
                const unzoomedW = Math.round(origW * zoom);
                const unzoomedH = Math.round(origH * zoom);
                ctx.drawImage(img, -unzoomedW / 2, -unzoomedH / 2, unzoomedW, unzoomedH);
            }
            ctx.restore();

            // 2. Dim outer margins outside the crop box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(0, 0, ratioW, ratioH);

            // 3. Clear crop box area and draw the bright cropped offCanvas inside it
            ctx.clearRect(mLeft, mTop, croppedW, croppedH);
            ctx.drawImage(offCanvas, mLeft, mTop, croppedW, croppedH);

            // 4. Draw 3x3 Rule-of-Thirds Grid inside crop box
            const strokeW = Math.max(2, Math.round(ratioW / 450));
            ctx.save();
            ctx.setLineDash([strokeW * 2, strokeW * 2]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mLeft + croppedW / 3, mTop); ctx.lineTo(mLeft + croppedW / 3, mTop + croppedH);
            ctx.moveTo(mLeft + (2 * croppedW) / 3, mTop); ctx.lineTo(mLeft + (2 * croppedW) / 3, mTop + croppedH);
            ctx.moveTo(mLeft, mTop + croppedH / 3); ctx.lineTo(mLeft + croppedW, mTop + croppedH / 3);
            ctx.moveTo(mLeft, mTop + (2 * croppedH) / 3); ctx.lineTo(mLeft + croppedW, mTop + (2 * croppedH) / 3);
            ctx.stroke();
            ctx.restore();

            // 5. Draw glowing cyan border around crop box
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = strokeW;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
            ctx.shadowBlur = 8;
            ctx.strokeRect(mLeft, mTop, croppedW, croppedH);
            ctx.restore();

            // 6. Draw 8 Interactive Handles
            const { handles } = getFreeChopHandles(ratioW, ratioH, studioState.cropMargins);
            const cornerSize = Math.max(12, Math.round(ratioW / 65));
            const edgeLen = Math.max(16, Math.round(ratioW / 45));
            const edgeThick = Math.max(6, Math.round(ratioW / 140));

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 6;

            // 4 Corner handles (circles)
            ['tl', 'tr', 'br', 'bl'].forEach(key => {
                const h = handles[key];
                ctx.beginPath();
                ctx.arc(h.x, h.y, cornerSize * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            });

            // 4 Edge midpoint pill handles
            ['t', 'b'].forEach(key => {
                const h = handles[key];
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(h.x - edgeLen / 2, h.y - edgeThick / 2, edgeLen, edgeThick, edgeThick / 2);
                } else {
                    ctx.rect(h.x - edgeLen / 2, h.y - edgeThick / 2, edgeLen, edgeThick);
                }
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            ['l', 'r'].forEach(key => {
                const h = handles[key];
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(h.x - edgeThick / 2, h.y - edgeLen / 2, edgeThick, edgeLen, edgeThick / 2);
                } else {
                    ctx.rect(h.x - edgeThick / 2, h.y - edgeLen / 2, edgeThick, edgeLen);
                }
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
            ctx.restore();

            // 7. Draw Dimension Badge (Pill at top center)
            ctx.save();
            const badgeText = `${croppedW} × ${croppedH} px`;
            ctx.font = `600 ${Math.max(11, Math.round(ratioW / 75))}px 'Inter', sans-serif`;
            const textMetrics = ctx.measureText(badgeText);
            const badgeW = textMetrics.width + 16;
            const badgeH = Math.max(18, Math.round(ratioW / 55));
            const badgeX = mLeft + croppedW / 2 - badgeW / 2;
            const badgeY = mTop > badgeH + 8 ? mTop - badgeH - 6 : mTop + 8;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
                ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
            }
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
            ctx.restore();

        } else {
            // Standard cropped rendering (for other tabs and final export)
            studioCanvas.width = finalW;
            studioCanvas.height = finalH;

            ctx.clearRect(0, 0, finalW, finalH);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(offCanvas, 0, 0, finalW, finalH);
        }
    }

    // ==========================================
    // Event Listeners: Image Studio UI
    // ==========================================
    if (btnEditOriginal) {
        btnEditOriginal.addEventListener('click', () => {
            if (selectedDataUrl) {
                openImageStudio(selectedDataUrl, 'original');
            }
        });
    }

    if (btnEditResult) {
        btnEditResult.addEventListener('click', () => {
            if (processedResultImg && processedResultImg.src) {
                openImageStudio(processedResultImg.src, 'result');
            }
        });
    }

    if (btnStudioClose) btnStudioClose.addEventListener('click', closeImageStudio);
    if (btnStudioCancel) btnStudioCancel.addEventListener('click', closeImageStudio);

    if (btnStudioReset) {
        btnStudioReset.addEventListener('click', () => {
            resetStudioState();
            renderStudioCanvas();
        });
    }

    // Studio Category & Tab Navigation (Separating Standard Tools & New Features)
    const btnCatCore = document.getElementById('btnCatCore');
    const btnCatNew = document.getElementById('btnCatNew');
    const tabsGroupCore = document.getElementById('tabsGroupCore');
    const tabsGroupNew = document.getElementById('tabsGroupNew');

    const studioTabs = document.querySelectorAll('.studio-tab');
    const tabContents = {
        crop: document.getElementById('tabContentCrop'),
        rotate: document.getElementById('tabContentRotate'),
        filters: document.getElementById('tabContentFilters'),
        chop_free: document.getElementById('tabContentChopFree'),
        resize: document.getElementById('tabContentResize'),
        vignette: document.getElementById('tabContentVignette'),
        text: document.getElementById('tabContentText'),
        overlay: document.getElementById('tabContentOverlay')
    };

    function activateStudioTab(targetTab) {
        studioTabs.forEach(t => {
            const isActive = t.dataset.tab === targetTab;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        Object.keys(tabContents).forEach(key => {
            if (tabContents[key]) {
                tabContents[key].classList.toggle('active', key === targetTab);
            }
        });

        const isFreeCut = targetTab === 'chop_free' && studioState.cropShape === 'freecut';
        if (freeCutToolbar) {
            freeCutToolbar.style.display = isFreeCut ? 'block' : 'none';
        }

        // Update canvas cursor for text drag, overlay drag, or free cut if active
        if (studioCanvas) {
            studioCanvas.classList.toggle('dragging-text', targetTab === 'text');
            studioCanvas.classList.toggle('dragging-overlay', targetTab === 'overlay');
            studioCanvas.classList.toggle('is-freecutting', isFreeCut);
        }

        renderStudioCanvas();
    }

    function switchStudioCategory(category) {
        const isCore = category === 'core';
        if (btnCatCore) btnCatCore.classList.toggle('active', isCore);
        if (btnCatNew) btnCatNew.classList.toggle('active', !isCore);
        if (tabsGroupCore) tabsGroupCore.classList.toggle('active', isCore);
        if (tabsGroupNew) tabsGroupNew.classList.toggle('active', !isCore);

        // Activate default tab for this category
        const defaultTab = isCore ? 'crop' : 'chop_free';
        activateStudioTab(defaultTab);
    }

    if (btnCatCore) {
        btnCatCore.addEventListener('click', () => switchStudioCategory('core'));
    }
    if (btnCatNew) {
        btnCatNew.addEventListener('click', () => switchStudioCategory('new'));
    }

    studioTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            activateStudioTab(targetTab);
        });
    });

    // 1. Aspect Ratio Buttons (Chops picture to exact aspect ratio, no extrusion)
    const ratioBtns = document.querySelectorAll('.ratio-btn');
    ratioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ratioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            studioState.aspectRatio = btn.dataset.ratio || 'free';
            if (studioState.aspectRatio === '1920:1080') {
                studioState.targetResolution = { width: 1920, height: 1080 };
            } else {
                studioState.targetResolution = null;
            }
            // Clear extrude square & manual resize distortion
            studioState.extrudeSquare = false;
            updateExtrudeUI();
            studioState.resize.hasCustomResize = false;
            studioState.resize.customWidth = 0;
            studioState.resize.customHeight = 0;
            document.querySelectorAll('.scale-btn').forEach(b => b.classList.toggle('active', b.dataset.scale === '1.0'));
            document.querySelectorAll('.res-preset-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.width === '1920' && studioState.aspectRatio === '1920:1080');
            });
            renderStudioCanvas();
        });
    });

    // Extrude to Square Handlers
    const btnExtrudeSquare = document.getElementById('btnExtrudeSquare');
    const extrudeStatusBadge = document.getElementById('extrudeStatusBadge');
    const btnResizeExtrudeSquare = document.getElementById('btnResizeExtrudeSquare');

    function toggleExtrudeSquare() {
        studioState.extrudeSquare = !studioState.extrudeSquare;

        if (studioState.extrudeSquare) {
            studioState.aspectRatio = 'free';
            document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
            studioState.resize.hasCustomResize = false;
            studioState.resize.customWidth = 0;
            studioState.resize.customHeight = 0;
        } else {
            const freeBtn = document.querySelector('.ratio-btn[data-ratio="free"]');
            if (freeBtn) freeBtn.classList.add('active');
        }

        updateExtrudeUI();
        renderStudioCanvas();
    }

    function updateExtrudeUI() {
        const isActive = !!studioState.extrudeSquare;
        if (btnExtrudeSquare) btnExtrudeSquare.classList.toggle('active', isActive);
        if (btnResizeExtrudeSquare) btnResizeExtrudeSquare.classList.toggle('active', isActive);
        if (extrudeStatusBadge) {
            extrudeStatusBadge.textContent = isActive 
                ? (window.ClearCutI18n?.extrudeOn || 'ON') 
                : (window.ClearCutI18n?.extrudeOff || 'OFF');
            extrudeStatusBadge.classList.toggle('active', isActive);
        }
    }

    if (btnExtrudeSquare) {
        btnExtrudeSquare.addEventListener('click', toggleExtrudeSquare);
    }
    if (btnResizeExtrudeSquare) {
        btnResizeExtrudeSquare.addEventListener('click', toggleExtrudeSquare);
    }

    // 2. Shape Chopper Buttons
    const shapeBtns = document.querySelectorAll('.shape-btn');
    shapeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shapeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            studioState.cropShape = btn.dataset.shape || 'rect';
            const isFreeCut = studioState.cropShape === 'freecut';
            if (freeCutToolbar) freeCutToolbar.style.display = isFreeCut ? 'block' : 'none';
            if (studioCanvas) studioCanvas.classList.toggle('is-freecutting', isFreeCut);
            renderStudioCanvas();
        });
    });

    // Free Cut Controls (Lasso vs Polygon, Finish, Undo, Reset)
    freeCutModeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            freeCutModeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode || 'lasso';
            studioState.freecut.mode = mode;
            if (freeCutHint && btn.dataset.hint) {
                freeCutHint.textContent = btn.dataset.hint;
            }
        });
    });

    if (btnFreeCutFinish) {
        btnFreeCutFinish.addEventListener('click', () => {
            if (studioState.freecut.points.length >= 3) {
                studioState.freecut.isClosed = true;
                renderStudioCanvas();
            }
        });
    }

    if (btnFreeCutUndo) {
        btnFreeCutUndo.addEventListener('click', () => {
            if (studioState.freecut.points.length > 0) {
                studioState.freecut.points.pop();
                if (studioState.freecut.points.length < 3) {
                    studioState.freecut.isClosed = false;
                }
                if (valFreeCutPoints) valFreeCutPoints.textContent = studioState.freecut.points.length;
                renderStudioCanvas();
            }
        });
    }

    if (btnFreeCutReset) {
        btnFreeCutReset.addEventListener('click', () => {
            studioState.freecut.points = [];
            studioState.freecut.isClosed = false;
            if (valFreeCutPoints) valFreeCutPoints.textContent = '0';
            renderStudioCanvas();
        });
    }

    // Cutout / Shape Border Stroke Controls
    if (btnShapeStroke) {
        btnShapeStroke.addEventListener('click', () => {
            studioState.shapeStroke.enabled = !studioState.shapeStroke.enabled;
            btnShapeStroke.classList.toggle('active', studioState.shapeStroke.enabled);
            if (statusShapeStroke) statusShapeStroke.textContent = studioState.shapeStroke.enabled ? 'ON' : 'OFF';
            if (shapeStrokeBody) shapeStrokeBody.style.display = studioState.shapeStroke.enabled ? 'flex' : 'none';
            renderStudioCanvas();
        });
    }

    shapeStrokeStyleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shapeStrokeStyleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            studioState.shapeStroke.style = btn.dataset.style || 'solid';
            if (!studioState.shapeStroke.enabled) {
                studioState.shapeStroke.enabled = true;
                if (btnShapeStroke) btnShapeStroke.classList.add('active');
                if (statusShapeStroke) statusShapeStroke.textContent = 'ON';
                if (shapeStrokeBody) shapeStrokeBody.style.display = 'flex';
            }
            renderStudioCanvas();
        });
    });

    if (inputShapeStrokeColor) {
        inputShapeStrokeColor.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            studioState.shapeStroke.color = val;
            if (hexShapeStrokeColor) hexShapeStrokeColor.textContent = val;
            document.querySelectorAll('.swatch-shape-stroke').forEach(b => {
                b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === val);
            });
            renderStudioCanvas();
        });
    }

    const swatchShapeStrokeBtns = document.querySelectorAll('.swatch-shape-stroke');
    swatchShapeStrokeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            swatchShapeStrokeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = (btn.dataset.color || '#ffffff').toLowerCase();
            studioState.shapeStroke.color = color;
            if (inputShapeStrokeColor) inputShapeStrokeColor.value = color;
            if (hexShapeStrokeColor) hexShapeStrokeColor.textContent = color;
            renderStudioCanvas();
        });
    });

    if (rangeShapeStrokeWidth && valShapeStrokeWidth) {
        rangeShapeStrokeWidth.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 6;
            studioState.shapeStroke.width = val;
            valShapeStrokeWidth.textContent = `${val}px`;
            renderStudioCanvas();
        });
    }

    // 3. Freeform Crop Margin Sliders (Chops edges off without extrusion)
    function attachCropMarginListener(slider, labelEl, key) {
        if (slider && labelEl) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10) || 0;
                studioState.cropMargins[key] = val;
                labelEl.textContent = `${val}%`;
                // Clear any manual resize distortion so free chop strictly chops the picture
                studioState.resize.hasCustomResize = false;
                studioState.resize.customWidth = 0;
                studioState.resize.customHeight = 0;
                document.querySelectorAll('.scale-btn').forEach(b => b.classList.toggle('active', b.dataset.scale === '1.0'));
                renderStudioCanvas();
            });
        }
    }

    attachCropMarginListener(rangeCropTop, valCropTop, 'top');
    attachCropMarginListener(rangeCropBottom, valCropBottom, 'bottom');
    attachCropMarginListener(rangeCropLeft, valCropLeft, 'left');
    attachCropMarginListener(rangeCropRight, valCropRight, 'right');

    function syncCropMarginUI() {
        if (rangeCropTop) rangeCropTop.value = studioState.cropMargins.top;
        if (valCropTop) valCropTop.textContent = `${studioState.cropMargins.top}%`;
        if (rangeCropBottom) rangeCropBottom.value = studioState.cropMargins.bottom;
        if (valCropBottom) valCropBottom.textContent = `${studioState.cropMargins.bottom}%`;
        if (rangeCropLeft) rangeCropLeft.value = studioState.cropMargins.left;
        if (valCropLeft) valCropLeft.textContent = `${studioState.cropMargins.left}%`;
        if (rangeCropRight) rangeCropRight.value = studioState.cropMargins.right;
        if (valCropRight) valCropRight.textContent = `${studioState.cropMargins.right}%`;
    }

    if (btnFreeChopReset) {
        btnFreeChopReset.addEventListener('click', () => {
            studioState.cropMargins = { top: 0, bottom: 0, left: 0, right: 0 };
            syncCropMarginUI();
            renderStudioCanvas();
        });
    }

    if (btnFreeChopFit) {
        btnFreeChopFit.addEventListener('click', () => {
            studioState.cropMargins = { top: 0, bottom: 0, left: 0, right: 0 };
            syncCropMarginUI();
            renderStudioCanvas();
        });
    }

    if (btnFreeChopSquare) {
        btnFreeChopSquare.addEventListener('click', () => {
            if (!studioState.sourceImg) return;
            const img = studioState.sourceImg;
            const origW = img.naturalWidth || img.width;
            const origH = img.naturalHeight || img.height;
            const isSideways = studioState.rotation === 90 || studioState.rotation === 270;
            const rotW = isSideways ? origH : origW;
            const rotH = isSideways ? origW : origH;

            const minDim = Math.min(rotW, rotH);
            const diffW = rotW - minDim;
            const diffH = rotH - minDim;

            const pctX = Math.min(45, Math.round(((diffW / 2) / rotW) * 100));
            const pctY = Math.min(45, Math.round(((diffH / 2) / rotH) * 100));

            studioState.cropMargins.left = pctX;
            studioState.cropMargins.right = pctX;
            studioState.cropMargins.top = pctY;
            studioState.cropMargins.bottom = pctY;

            syncCropMarginUI();
            renderStudioCanvas();
        });
    }

    // 4. Resize Handlers
    if (btnLockAspect) {
        btnLockAspect.addEventListener('click', () => {
            studioState.resize.lockAspect = !studioState.resize.lockAspect;
            btnLockAspect.classList.toggle('active', studioState.resize.lockAspect);
        });
    }

    if (inputResizeWidth && inputResizeHeight) {
        inputResizeWidth.addEventListener('input', (e) => {
            const newW = parseInt(e.target.value, 10);
            if (newW > 10) {
                studioState.resize.hasCustomResize = true;
                studioState.resize.customWidth = newW;
                if (studioState.resize.lockAspect) {
                    const baseW = parseInt(inputResizeWidth.dataset.baseW, 10) || (studioState.sourceImg ? (studioState.sourceImg.naturalWidth || studioState.sourceImg.width) : newW);
                    const baseH = parseInt(inputResizeHeight.dataset.baseH, 10) || (studioState.sourceImg ? (studioState.sourceImg.naturalHeight || studioState.sourceImg.height) : newW);
                    const aspect = baseW / baseH;
                    const newH = Math.max(10, Math.round(newW / aspect));
                    studioState.resize.customHeight = newH;
                    inputResizeHeight.value = newH;
                }
                renderStudioCanvas();
            }
        });

        inputResizeHeight.addEventListener('input', (e) => {
            const newH = parseInt(e.target.value, 10);
            if (newH > 10) {
                studioState.resize.hasCustomResize = true;
                studioState.resize.customHeight = newH;
                if (studioState.resize.lockAspect) {
                    const baseW = parseInt(inputResizeWidth.dataset.baseW, 10) || (studioState.sourceImg ? (studioState.sourceImg.naturalWidth || studioState.sourceImg.width) : newH);
                    const baseH = parseInt(inputResizeHeight.dataset.baseH, 10) || (studioState.sourceImg ? (studioState.sourceImg.naturalHeight || studioState.sourceImg.height) : newH);
                    const aspect = baseW / baseH;
                    const newW = Math.max(10, Math.round(newH * aspect));
                    studioState.resize.customWidth = newW;
                    inputResizeWidth.value = newW;
                }
                renderStudioCanvas();
            }
        });
    }

    // Quick Scale Presets (scales relative to current chopped dimensions)
    const scaleBtns = document.querySelectorAll('.scale-btn');
    scaleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            scaleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const scale = parseFloat(btn.dataset.scale) || 1.0;
            if (scale === 1.0) {
                studioState.resize.hasCustomResize = false;
                studioState.resize.customWidth = 0;
                studioState.resize.customHeight = 0;
            } else {
                studioState.resize.hasCustomResize = true;
                const baseW = parseInt(inputResizeWidth.dataset.baseW, 10) || (studioState.sourceImg ? (studioState.sourceImg.naturalWidth || studioState.sourceImg.width) : 100);
                const baseH = parseInt(inputResizeHeight.dataset.baseH, 10) || (studioState.sourceImg ? (studioState.sourceImg.naturalHeight || studioState.sourceImg.height) : 100);

                const targetW = Math.round(baseW * scale);
                const targetH = Math.round(baseH * scale);

                studioState.resize.customWidth = targetW;
                studioState.resize.customHeight = targetH;

                if (inputResizeWidth) inputResizeWidth.value = targetW;
                if (inputResizeHeight) inputResizeHeight.value = targetH;
            }

            renderStudioCanvas();
        });
    });

    // Resolution Presets in Tab 5 (Resize)
    const resPresetBtns = document.querySelectorAll('.res-preset-btn');
    resPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            resPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetW = parseInt(btn.dataset.width, 10);
            const targetH = parseInt(btn.dataset.height, 10);
            if (targetW > 20 && targetH > 20) {
                studioState.resize.hasCustomResize = true;
                studioState.resize.customWidth = targetW;
                studioState.resize.customHeight = targetH;
                studioState.targetResolution = { width: targetW, height: targetH };
                if (inputResizeWidth) inputResizeWidth.value = targetW;
                if (inputResizeHeight) inputResizeHeight.value = targetH;
                document.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
                renderStudioCanvas();
            }
        });
    });

    function setCropZoom(val) {
        const clamped = Math.max(10, Math.min(300, Math.round(val)));
        studioState.cropZoom = clamped;
        if (rangeCropZoom) rangeCropZoom.value = clamped;
        if (valCropZoom) valCropZoom.textContent = `${clamped}%`;
        if (floatingZoomBadge) floatingZoomBadge.textContent = `${clamped}%`;

        document.querySelectorAll('.zoom-pill-btn').forEach(btn => {
            const z = parseInt(btn.dataset.zoom, 10);
            btn.classList.toggle('active', z === clamped);
        });

        renderStudioCanvas();
    }

    // Photo Zoom Slider Listener
    if (rangeCropZoom) {
        rangeCropZoom.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 100;
            setCropZoom(val);
        });
    }

    // Zoom Step Controls (Sidebar buttons & Canvas Floating Toolbar)
    function zoomOutStep() {
        const current = studioState.cropZoom || 100;
        const step = current <= 25 ? 5 : 10;
        setCropZoom(current - step);
    }

    function zoomInStep() {
        const current = studioState.cropZoom || 100;
        const step = current < 25 ? 5 : 10;
        setCropZoom(current + step);
    }

    if (btnZoomOut) btnZoomOut.addEventListener('click', zoomOutStep);
    if (btnZoomIn) btnZoomIn.addEventListener('click', zoomInStep);
    if (btnResetZoom) btnResetZoom.addEventListener('click', () => setCropZoom(100));

    if (btnFloatingZoomOut) btnFloatingZoomOut.addEventListener('click', zoomOutStep);
    if (btnFloatingZoomIn) btnFloatingZoomIn.addEventListener('click', zoomInStep);
    if (btnFloatingZoomReset) btnFloatingZoomReset.addEventListener('click', () => setCropZoom(100));

    // Quick Zoom Presets
    document.querySelectorAll('.zoom-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const z = parseInt(btn.dataset.zoom, 10);
            if (!isNaN(z)) setCropZoom(z);
        });
    });

    // Photo Framing / Pan Controls
    if (rangeCropPanX) {
        rangeCropPanX.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            studioState.cropPan.x = val;
            if (valCropPanX) valCropPanX.textContent = `${val}%`;
            updatePanQuickButtons();
            renderStudioCanvas();
        });
    }

    if (rangeCropPanY) {
        rangeCropPanY.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            studioState.cropPan.y = val;
            if (valCropPanY) valCropPanY.textContent = `${val}%`;
            updatePanQuickButtons();
            renderStudioCanvas();
        });
    }

    function updatePanQuickButtons() {
        document.querySelectorAll('.pan-quick-btn').forEach(b => {
            const bx = parseInt(b.dataset.panX, 10);
            const by = parseInt(b.dataset.panY, 10);
            b.classList.toggle('active', bx === studioState.cropPan.x && by === studioState.cropPan.y);
        });
    }

    function resetPan() {
        setCropZoom(100);
        studioState.cropPan.x = 0;
        studioState.cropPan.y = 0;
        if (rangeCropPanX) rangeCropPanX.value = 0;
        if (valCropPanX) valCropPanX.textContent = '0%';
        if (rangeCropPanY) rangeCropPanY.value = 0;
        if (valCropPanY) valCropPanY.textContent = '0%';
        updatePanQuickButtons();
        renderStudioCanvas();
    }

    if (btnResetPan) {
        btnResetPan.addEventListener('click', resetPan);
    }

    if (btnPanCenterQuick) {
        btnPanCenterQuick.addEventListener('click', resetPan);
    }

    document.querySelectorAll('.pan-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const px = parseInt(btn.dataset.panX, 10) || 0;
            const py = parseInt(btn.dataset.panY, 10) || 0;
            studioState.cropPan.x = px;
            studioState.cropPan.y = py;
            if (rangeCropPanX) rangeCropPanX.value = px;
            if (valCropPanX) valCropPanX.textContent = `${px}%`;
            if (rangeCropPanY) rangeCropPanY.value = py;
            if (valCropPanY) valCropPanY.textContent = `${py}%`;
            updatePanQuickButtons();
            renderStudioCanvas();
        });
    });

    // 5. Turn & Flip Buttons
    const btnRotateLeft = document.getElementById('btnRotateLeft');
    const btnRotateRight = document.getElementById('btnRotateRight');
    const btnFlipH = document.getElementById('btnFlipH');
    const btnFlipV = document.getElementById('btnFlipV');

    if (btnRotateLeft) {
        btnRotateLeft.addEventListener('click', () => {
            studioState.rotation = (studioState.rotation + 270) % 360;
            renderStudioCanvas();
        });
    }

    if (btnRotateRight) {
        btnRotateRight.addEventListener('click', () => {
            studioState.rotation = (studioState.rotation + 90) % 360;
            renderStudioCanvas();
        });
    }

    if (btnFlipH) {
        btnFlipH.addEventListener('click', () => {
            studioState.flipH = !studioState.flipH;
            renderStudioCanvas();
        });
    }

    if (btnFlipV) {
        btnFlipV.addEventListener('click', () => {
            studioState.flipV = !studioState.flipV;
            renderStudioCanvas();
        });
    }

    // 6. Filter Preset Pills & Vignette
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            studioState.activeFilter = pill.dataset.filter || 'normal';

            if (studioState.activeFilter === 'vignette') {
                studioState.vignette = 60;
                if (rangeVignette) rangeVignette.value = 60;
                if (valVignette) valVignette.textContent = '60%';
            }

            renderStudioCanvas();
        });
    });

    // Edge Blurring & Softness Controls
    const rangeEdgeBlur = document.getElementById('rangeEdgeBlur');
    const valEdgeBlur = document.getElementById('valEdgeBlur');
    const btnEdgeBlurRadial = document.getElementById('btnEdgeBlurRadial');
    const btnEdgeBlurFeather = document.getElementById('btnEdgeBlurFeather');
    const edgePresetBtns = document.querySelectorAll('.edge-preset-btn');

    if (rangeEdgeBlur && valEdgeBlur) {
        rangeEdgeBlur.addEventListener('input', (e) => {
            studioState.edgeBlur = parseInt(e.target.value, 10) || 0;
            valEdgeBlur.textContent = `${studioState.edgeBlur}%`;
            edgePresetBtns.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.val, 10) === studioState.edgeBlur);
            });
            renderStudioCanvas();
        });
    }

    if (btnEdgeBlurRadial) {
        btnEdgeBlurRadial.addEventListener('click', () => {
            studioState.edgeBlurMode = 'radial';
            btnEdgeBlurRadial.classList.add('active');
            if (btnEdgeBlurFeather) btnEdgeBlurFeather.classList.remove('active');
            renderStudioCanvas();
        });
    }

    if (btnEdgeBlurFeather) {
        btnEdgeBlurFeather.addEventListener('click', () => {
            studioState.edgeBlurMode = 'feather';
            btnEdgeBlurFeather.classList.add('active');
            if (btnEdgeBlurRadial) btnEdgeBlurRadial.classList.remove('active');
            renderStudioCanvas();
        });
    }

    edgePresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.val, 10) || 0;
            studioState.edgeBlur = val;
            if (rangeEdgeBlur) rangeEdgeBlur.value = val;
            if (valEdgeBlur) valEdgeBlur.textContent = `${val}%`;
            edgePresetBtns.forEach(b => b.classList.toggle('active', b === btn));
            renderStudioCanvas();
        });
    });

    // Adjustment Sliders & Dedicated Vignette Controls
    const btnPresetVignette = document.getElementById('btnPresetVignette');
    if (rangeVignette && valVignette) {
        rangeVignette.addEventListener('input', (e) => {
            studioState.vignette = parseInt(e.target.value, 10) || 0;
            valVignette.textContent = `${studioState.vignette}%`;
            if (btnPresetVignette) {
                btnPresetVignette.classList.toggle('active', studioState.vignette > 0);
            }
            renderStudioCanvas();
        });
    }

    if (btnPresetVignette) {
        btnPresetVignette.addEventListener('click', () => {
            const nextVal = studioState.vignette > 0 ? 0 : 60;
            studioState.vignette = nextVal;
            if (rangeVignette) rangeVignette.value = nextVal;
            if (valVignette) valVignette.textContent = `${nextVal}%`;
            btnPresetVignette.classList.toggle('active', nextVal > 0);
            renderStudioCanvas();
        });
    }

    // Vignette Edge Color Picker & Swatches
    if (inputVignetteColor) {
        inputVignetteColor.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            studioState.vignetteColor = val;
            if (hexVignetteColor) hexVignetteColor.textContent = val;
            document.querySelectorAll('.swatch-vignette').forEach(b => {
                b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === val);
            });
            // If vignette slider is at 0, automatically turn it on to 45% so user sees the color!
            if (studioState.vignette === 0) {
                studioState.vignette = 45;
                if (rangeVignette) rangeVignette.value = 45;
                if (valVignette) valVignette.textContent = '45%';
                if (btnPresetVignette) btnPresetVignette.classList.add('active');
            }
            renderStudioCanvas();
        });
    }

    const swatchVignetteBtns = document.querySelectorAll('.swatch-vignette');
    swatchVignetteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            swatchVignetteBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = (btn.dataset.color || '#000000').toLowerCase();
            studioState.vignetteColor = color;
            if (inputVignetteColor) inputVignetteColor.value = color;
            if (hexVignetteColor) hexVignetteColor.textContent = color;
            // If vignette slider is at 0, automatically turn it on to 45% so user sees the color!
            if (studioState.vignette === 0) {
                studioState.vignette = 45;
                if (rangeVignette) rangeVignette.value = 45;
                if (valVignette) valVignette.textContent = '45%';
                if (btnPresetVignette) btnPresetVignette.classList.add('active');
            }
            renderStudioCanvas();
        });
    });

    if (rangeBrightness && valBrightness) {
        rangeBrightness.addEventListener('input', (e) => {
            studioState.brightness = e.target.value;
            valBrightness.textContent = (e.target.value > 0 ? '+' : '') + e.target.value + '%';
            renderStudioCanvas();
        });
    }

    if (rangeContrast && valContrast) {
        rangeContrast.addEventListener('input', (e) => {
            studioState.contrast = e.target.value;
            valContrast.textContent = (e.target.value > 0 ? '+' : '') + e.target.value + '%';
            renderStudioCanvas();
        });
    }

    if (rangeSaturation && valSaturation) {
        rangeSaturation.addEventListener('input', (e) => {
            studioState.saturation = e.target.value;
            valSaturation.textContent = (e.target.value > 0 ? '+' : '') + e.target.value + '%';
            renderStudioCanvas();
        });
    }

    // Picture Opacity / Transparency Handlers
    if (rangePictureOpacity && valPictureOpacity) {
        rangePictureOpacity.addEventListener('input', (e) => {
            const op = parseInt(e.target.value, 10) || 100;
            studioState.pictureOpacity = op;
            valPictureOpacity.textContent = `${op}%`;
            picOpBtns.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.opacity, 10) === op);
            });
            renderStudioCanvas();
        });
    }

    picOpBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const op = parseInt(btn.dataset.opacity, 10) || 100;
            studioState.pictureOpacity = op;
            if (rangePictureOpacity) rangePictureOpacity.value = op;
            if (valPictureOpacity) valPictureOpacity.textContent = `${op}%`;
            picOpBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderStudioCanvas();
        });
    });

    // Hue Rotation Slider
    if (rangeHueRotate && valHueRotate) {
        rangeHueRotate.addEventListener('input', (e) => {
            const deg = parseInt(e.target.value, 10) || 0;
            studioState.hueRotate = deg;
            valHueRotate.textContent = `${deg > 0 ? '+' : ''}${deg}°`;
            renderStudioCanvas();
        });
    }

    // Cutout & Picture Drop Shadow Handlers
    if (btnCutoutShadow) {
        btnCutoutShadow.addEventListener('click', () => {
            studioState.shadow.enabled = !studioState.shadow.enabled;
            btnCutoutShadow.classList.toggle('active', studioState.shadow.enabled);
            if (statusCutoutShadow) statusCutoutShadow.textContent = studioState.shadow.enabled ? 'ON' : 'OFF';
            if (cutoutShadowBody) cutoutShadowBody.style.display = studioState.shadow.enabled ? 'flex' : 'none';
            renderStudioCanvas();
        });
    }

    const shadowPresets = {
        soft: { blur: 20, opacity: 50, offsetX: 0, offsetY: 12 },
        '3d': { blur: 28, opacity: 65, offsetX: 16, offsetY: 20 },
        float: { blur: 36, opacity: 55, offsetX: 0, offsetY: 28 },
        halo: { blur: 30, opacity: 70, offsetX: 0, offsetY: 0 },
        ground: { blur: 14, opacity: 60, offsetX: 0, offsetY: 32 }
    };

    shadowPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shadowPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const key = btn.dataset.preset;
            if (shadowPresets[key]) {
                const p = shadowPresets[key];
                studioState.shadow.blur = p.blur;
                studioState.shadow.opacity = p.opacity;
                studioState.shadow.offsetX = p.offsetX;
                studioState.shadow.offsetY = p.offsetY;
                if (rangeShadowBlur) rangeShadowBlur.value = p.blur;
                if (valShadowBlur) valShadowBlur.textContent = `${p.blur}px`;
                if (rangeShadowOpacity) rangeShadowOpacity.value = p.opacity;
                if (valShadowOpacity) valShadowOpacity.textContent = `${p.opacity}%`;
                if (rangeShadowOffsetX) rangeShadowOffsetX.value = p.offsetX;
                if (valShadowOffsetX) valShadowOffsetX.textContent = `${p.offsetX > 0 ? '+' : ''}${p.offsetX}px`;
                if (rangeShadowOffsetY) rangeShadowOffsetY.value = p.offsetY;
                if (valShadowOffsetY) valShadowOffsetY.textContent = `${p.offsetY > 0 ? '+' : ''}${p.offsetY}px`;
            }
            if (!studioState.shadow.enabled) {
                studioState.shadow.enabled = true;
                if (btnCutoutShadow) btnCutoutShadow.classList.add('active');
                if (statusCutoutShadow) statusCutoutShadow.textContent = 'ON';
                if (cutoutShadowBody) cutoutShadowBody.style.display = 'flex';
            }
            renderStudioCanvas();
        });
    });

    if (inputShadowColor) {
        inputShadowColor.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            studioState.shadow.color = val;
            if (hexShadowColor) hexShadowColor.textContent = val;
            document.querySelectorAll('.swatch-shadow').forEach(b => {
                b.classList.toggle('active', (b.dataset.color || '').toLowerCase() === val);
            });
            renderStudioCanvas();
        });
    }

    const swatchShadowBtns = document.querySelectorAll('.swatch-shadow');
    swatchShadowBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            swatchShadowBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = (btn.dataset.color || '#000000').toLowerCase();
            studioState.shadow.color = color;
            if (inputShadowColor) inputShadowColor.value = color;
            if (hexShadowColor) hexShadowColor.textContent = color;
            renderStudioCanvas();
        });
    });

    if (rangeShadowBlur && valShadowBlur) {
        rangeShadowBlur.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            studioState.shadow.blur = val;
            valShadowBlur.textContent = `${val}px`;
            shadowPresetBtns.forEach(b => b.classList.toggle('active', b.dataset.preset === 'custom'));
            renderStudioCanvas();
        });
    }

    if (rangeShadowOpacity && valShadowOpacity) {
        rangeShadowOpacity.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 60;
            studioState.shadow.opacity = val;
            valShadowOpacity.textContent = `${val}%`;
            shadowPresetBtns.forEach(b => b.classList.toggle('active', b.dataset.preset === 'custom'));
            renderStudioCanvas();
        });
    }

    if (rangeShadowOffsetX && valShadowOffsetX) {
        rangeShadowOffsetX.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            studioState.shadow.offsetX = val;
            valShadowOffsetX.textContent = `${val > 0 ? '+' : ''}${val}px`;
            shadowPresetBtns.forEach(b => b.classList.toggle('active', b.dataset.preset === 'custom'));
            renderStudioCanvas();
        });
    }

    if (rangeShadowOffsetY && valShadowOffsetY) {
        rangeShadowOffsetY.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            studioState.shadow.offsetY = val;
            valShadowOffsetY.textContent = `${val > 0 ? '+' : ''}${val}px`;
            shadowPresetBtns.forEach(b => b.classList.toggle('active', b.dataset.preset === 'custom'));
            renderStudioCanvas();
        });
    }

    // 7. Text Overlay Handlers
    if (studioTextInput) {
        studioTextInput.addEventListener('input', (e) => {
            studioState.text.content = e.target.value;
            renderStudioCanvas();
        });
    }

    if (selectFontFamily) {
        selectFontFamily.addEventListener('change', (e) => {
            studioState.text.font = e.target.value;
            renderStudioCanvas();
        });
    }

    if (rangeFontSize && valFontSize) {
        rangeFontSize.addEventListener('input', (e) => {
            studioState.text.size = parseInt(e.target.value, 10) || 36;
            valFontSize.textContent = `${studioState.text.size}px`;
            renderStudioCanvas();
        });
    }

    if (rangeTextOpacity && valTextOpacity) {
        rangeTextOpacity.addEventListener('input', (e) => {
            const op = parseInt(e.target.value, 10) || 100;
            studioState.text.opacity = op;
            valTextOpacity.textContent = `${op}%`;
            document.querySelectorAll('.text-op-btn').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.opacity, 10) === op);
            });
            renderStudioCanvas();
        });
    }

    const textOpBtns = document.querySelectorAll('.text-op-btn');
    textOpBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const op = parseInt(btn.dataset.opacity, 10) || 100;
            studioState.text.opacity = op;
            if (rangeTextOpacity) rangeTextOpacity.value = op;
            if (valTextOpacity) valTextOpacity.textContent = `${op}%`;
            textOpBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderStudioCanvas();
        });
    });

    // Word Fill Color Picker & Swatches
    if (inputTextColor) {
        inputTextColor.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            studioState.text.color = val;
            if (hexTextColor) hexTextColor.textContent = val;
            document.querySelectorAll('.swatch-word').forEach(b => {
                b.classList.toggle('active', b.dataset.color.toLowerCase() === val);
            });
            renderStudioCanvas();
        });
    }

    const swatchWordBtns = document.querySelectorAll('.swatch-word');
    swatchWordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            swatchWordBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.dataset.color || '#ffffff';
            studioState.text.color = color;
            if (inputTextColor) inputTextColor.value = color;
            if (hexTextColor) hexTextColor.textContent = color.toLowerCase();
            renderStudioCanvas();
        });
    });

    // Word Outline Controls
    if (btnTextOutline) {
        btnTextOutline.addEventListener('click', () => {
            studioState.text.outline = !studioState.text.outline;
            btnTextOutline.classList.toggle('active', studioState.text.outline);
            if (statusTextOutline) statusTextOutline.textContent = studioState.text.outline ? 'ON' : 'OFF';
            if (outlineBody) outlineBody.style.display = studioState.text.outline ? 'flex' : 'none';
            renderStudioCanvas();
        });
    }

    if (inputOutlineColor) {
        inputOutlineColor.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            studioState.text.outlineColor = val;
            if (hexOutlineColor) hexOutlineColor.textContent = val;
            document.querySelectorAll('.swatch-outline').forEach(b => {
                b.classList.toggle('active', b.dataset.color.toLowerCase() === val);
            });
            renderStudioCanvas();
        });
    }

    const swatchOutlineBtns = document.querySelectorAll('.swatch-outline');
    swatchOutlineBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            swatchOutlineBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.dataset.color || '#000000';
            studioState.text.outlineColor = color;
            if (inputOutlineColor) inputOutlineColor.value = color;
            if (hexOutlineColor) hexOutlineColor.textContent = color.toLowerCase();
            renderStudioCanvas();
        });
    });

    if (rangeOutlineWidth && valOutlineWidth) {
        rangeOutlineWidth.addEventListener('input', (e) => {
            studioState.text.outlineWidth = parseInt(e.target.value, 10) || 4;
            valOutlineWidth.textContent = `${studioState.text.outlineWidth}px`;
            renderStudioCanvas();
        });
    }

    textStrokeStyleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            textStrokeStyleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            studioState.text.strokeStyle = btn.dataset.style || 'solid';
            if (!studioState.text.outline) {
                studioState.text.outline = true;
                if (btnTextOutline) btnTextOutline.classList.add('active');
                if (statusTextOutline) statusTextOutline.textContent = 'ON';
                if (outlineBody) outlineBody.style.display = 'flex';
            }
            renderStudioCanvas();
        });
    });

    // Word Glow Controls
    if (btnTextGlow) {
        btnTextGlow.addEventListener('click', () => {
            studioState.text.glow = !studioState.text.glow;
            btnTextGlow.classList.toggle('active', studioState.text.glow);
            if (statusTextGlow) statusTextGlow.textContent = studioState.text.glow ? 'ON' : 'OFF';
            if (glowBody) glowBody.style.display = studioState.text.glow ? 'flex' : 'none';
            renderStudioCanvas();
        });
    }

    if (inputGlowColor) {
        inputGlowColor.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            studioState.text.glowColor = val;
            if (hexGlowColor) hexGlowColor.textContent = val;
            document.querySelectorAll('.swatch-glow').forEach(b => {
                b.classList.toggle('active', b.dataset.color.toLowerCase() === val);
            });
            renderStudioCanvas();
        });
    }

    const swatchGlowBtns = document.querySelectorAll('.swatch-glow');
    swatchGlowBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            swatchGlowBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.dataset.color || '#0ea5e9';
            studioState.text.glowColor = color;
            if (inputGlowColor) inputGlowColor.value = color;
            if (hexGlowColor) hexGlowColor.textContent = color.toLowerCase();
            renderStudioCanvas();
        });
    });

    if (rangeGlowBlur && valGlowBlur) {
        rangeGlowBlur.addEventListener('input', (e) => {
            studioState.text.glowBlur = parseInt(e.target.value, 10) || 14;
            valGlowBlur.textContent = `${studioState.text.glowBlur}px`;
            renderStudioCanvas();
        });
    }

    // Bold, Italic & Underline
    if (btnTextBold) {
        btnTextBold.addEventListener('click', () => {
            studioState.text.bold = !studioState.text.bold;
            btnTextBold.classList.toggle('active', studioState.text.bold);
            renderStudioCanvas();
        });
    }

    if (btnTextItalic) {
        btnTextItalic.addEventListener('click', () => {
            studioState.text.italic = !studioState.text.italic;
            btnTextItalic.classList.toggle('active', studioState.text.italic);
            renderStudioCanvas();
        });
    }

    if (btnTextUnderline) {
        btnTextUnderline.addEventListener('click', () => {
            studioState.text.underline = !studioState.text.underline;
            btnTextUnderline.classList.toggle('active', studioState.text.underline);
            renderStudioCanvas();
        });
    }

    if (btnPosTop) {
        btnPosTop.addEventListener('click', () => {
            studioState.text.x = 0.5;
            studioState.text.y = 0.15;
            renderStudioCanvas();
        });
    }

    if (btnPosCenter) {
        btnPosCenter.addEventListener('click', () => {
            studioState.text.x = 0.5;
            studioState.text.y = 0.5;
            renderStudioCanvas();
        });
    }

    if (btnPosBottom) {
        btnPosBottom.addEventListener('click', () => {
            studioState.text.x = 0.5;
            studioState.text.y = 0.85;
            renderStudioCanvas();
        });
    }

    // ==========================================
    // 8. Overlay Image (Picture-in-Picture) Handlers
    // ==========================================
    const inputOverlayFile = document.getElementById('inputOverlayFile');
    const btnTriggerOverlayUpload = document.getElementById('btnTriggerOverlayUpload');
    const btnChangeOverlay = document.getElementById('btnChangeOverlay');
    const btnRemoveOverlay = document.getElementById('btnRemoveOverlay');
    const overlayEmptyState = document.getElementById('overlayEmptyState');
    const overlayLoadedState = document.getElementById('overlayLoadedState');
    const overlayControlsPanel = document.getElementById('overlayControlsPanel');
    const overlayThumbImg = document.getElementById('overlayThumbImg');
    const overlayFileInfo = document.getElementById('overlayFileInfo');
    const overlayDimInfo = document.getElementById('overlayDimInfo');

    const rangeOverlaySize = document.getElementById('rangeOverlaySize');
    const valOverlaySize = document.getElementById('valOverlaySize');
    const overlaySizeBtns = document.querySelectorAll('.overlay-size-btn');

    const rangeOverlayOpacity = document.getElementById('rangeOverlayOpacity');
    const valOverlayOpacity = document.getElementById('valOverlayOpacity');
    const overlayOpBtns = document.querySelectorAll('.overlay-op-btn');

    const rangeOverlayPosX = document.getElementById('rangeOverlayPosX');
    const valOverlayPosX = document.getElementById('valOverlayPosX');
    const rangeOverlayPosY = document.getElementById('rangeOverlayPosY');
    const valOverlayPosY = document.getElementById('valOverlayPosY');
    const overlayAlignBtns = document.querySelectorAll('.overlay-align-btn');

    if (btnTriggerOverlayUpload && inputOverlayFile) {
        btnTriggerOverlayUpload.addEventListener('click', () => inputOverlayFile.click());
    }

    if (btnChangeOverlay && inputOverlayFile) {
        btnChangeOverlay.addEventListener('click', () => inputOverlayFile.click());
    }

    if (inputOverlayFile) {
        inputOverlayFile.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    studioState.overlay.img = img;
                    studioState.overlay.filename = file.name;

                    if (overlayThumbImg) overlayThumbImg.src = evt.target.result;
                    if (overlayFileInfo) overlayFileInfo.textContent = file.name;
                    if (overlayDimInfo) overlayDimInfo.textContent = `${img.naturalWidth || img.width} × ${img.naturalHeight || img.height} px`;

                    if (overlayEmptyState) overlayEmptyState.style.display = 'none';
                    if (overlayLoadedState) overlayLoadedState.style.display = 'flex';
                    if (overlayControlsPanel) overlayControlsPanel.style.display = 'block';

                    renderStudioCanvas();
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnRemoveOverlay) {
        btnRemoveOverlay.addEventListener('click', () => {
            studioState.overlay.img = null;
            studioState.overlay.filename = '';
            if (inputOverlayFile) inputOverlayFile.value = '';
            if (overlayThumbImg) overlayThumbImg.src = '';

            if (overlayEmptyState) overlayEmptyState.style.display = 'flex';
            if (overlayLoadedState) overlayLoadedState.style.display = 'none';
            if (overlayControlsPanel) overlayControlsPanel.style.display = 'none';

            renderStudioCanvas();
        });
    }

    // Size / Scale Handlers
    if (rangeOverlaySize && valOverlaySize) {
        rangeOverlaySize.addEventListener('input', (e) => {
            const size = parseInt(e.target.value, 10) || 35;
            studioState.overlay.size = size;
            valOverlaySize.textContent = `${size}%`;
            overlaySizeBtns.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === size);
            });
            renderStudioCanvas();
        });
    }

    overlaySizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const size = parseInt(btn.dataset.size, 10) || 35;
            studioState.overlay.size = size;
            if (rangeOverlaySize) rangeOverlaySize.value = size;
            if (valOverlaySize) valOverlaySize.textContent = `${size}%`;
            overlaySizeBtns.forEach(b => b.classList.toggle('active', b === btn));
            renderStudioCanvas();
        });
    });

    // Transparency / Opacity Handlers
    if (rangeOverlayOpacity && valOverlayOpacity) {
        rangeOverlayOpacity.addEventListener('input', (e) => {
            const opacity = parseInt(e.target.value, 10) || 100;
            studioState.overlay.opacity = opacity;
            valOverlayOpacity.textContent = `${opacity}%`;
            overlayOpBtns.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.opacity, 10) === opacity);
            });
            renderStudioCanvas();
        });
    }

    overlayOpBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const opacity = parseInt(btn.dataset.opacity, 10) || 100;
            studioState.overlay.opacity = opacity;
            if (rangeOverlayOpacity) rangeOverlayOpacity.value = opacity;
            if (valOverlayOpacity) valOverlayOpacity.textContent = `${opacity}%`;
            overlayOpBtns.forEach(b => b.classList.toggle('active', b === btn));
            renderStudioCanvas();
        });
    });

    // Position X & Y Sliders
    if (rangeOverlayPosX && valOverlayPosX) {
        rangeOverlayPosX.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            studioState.overlay.x = val / 100;
            valOverlayPosX.textContent = `${val}%`;
            overlayAlignBtns.forEach(btn => btn.classList.remove('active'));
            renderStudioCanvas();
        });
    }

    if (rangeOverlayPosY && valOverlayPosY) {
        rangeOverlayPosY.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10) || 0;
            studioState.overlay.y = val / 100;
            valOverlayPosY.textContent = `${val}%`;
            overlayAlignBtns.forEach(btn => btn.classList.remove('active'));
            renderStudioCanvas();
        });
    }

    // 5-Point Quick Alignment Presets
    const alignCoords = {
        tl: { x: 0.18, y: 0.18 },
        center: { x: 0.5, y: 0.5 },
        tr: { x: 0.82, y: 0.18 },
        bl: { x: 0.18, y: 0.82 },
        br: { x: 0.82, y: 0.82 }
    };

    overlayAlignBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.align;
            const coords = alignCoords[key];
            if (coords) {
                studioState.overlay.x = coords.x;
                studioState.overlay.y = coords.y;
                const pctX = Math.round(coords.x * 100);
                const pctY = Math.round(coords.y * 100);
                if (rangeOverlayPosX) rangeOverlayPosX.value = pctX;
                if (valOverlayPosX) valOverlayPosX.textContent = `${pctX}%`;
                if (rangeOverlayPosY) rangeOverlayPosY.value = pctY;
                if (valOverlayPosY) valOverlayPosY.textContent = `${pctY}%`;
                overlayAlignBtns.forEach(b => b.classList.toggle('active', b === btn));
                renderStudioCanvas();
            }
        });
    });

    // Canvas Interactive Dragging (Text Dragging, Overlay Dragging, Free Cut, or Photo Framing Pan)
    function getNormalizedCanvasPoint(e) {
        if (!studioCanvas) return null;
        const rect = studioCanvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const ry = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        return { x: rx, y: ry };
    }

    function handleFreeCutPointerDown(e) {
        const pt = getNormalizedCanvasPoint(e);
        if (!pt) return;

        if (e.cancelable && e.type && e.type.startsWith('touch')) {
            e.preventDefault();
        }

        if (studioState.freecut.mode === 'polygon') {
            const pts = studioState.freecut.points;
            if (pts.length >= 3) {
                const distToFirst = Math.hypot(pt.x - pts[0].x, pt.y - pts[0].y);
                if (distToFirst < 0.05) {
                    studioState.freecut.isClosed = true;
                    if (valFreeCutPoints) valFreeCutPoints.textContent = pts.length;
                    renderStudioCanvas();
                    return;
                }
            }

            if (studioState.freecut.isClosed) {
                studioState.freecut.points = [pt];
                studioState.freecut.isClosed = false;
            } else {
                pts.push(pt);
            }
            if (valFreeCutPoints) valFreeCutPoints.textContent = pts.length;
            renderStudioCanvas();
        } else {
            // Lasso mode
            studioState.freecut.isDrawing = true;
            studioState.freecut.isClosed = false;
            studioState.freecut.points = [pt];
            if (studioCanvas) studioCanvas.classList.add('is-freecut-drawing');
            if (valFreeCutPoints) valFreeCutPoints.textContent = '1';
            renderStudioCanvas();
        }
    }

    function handleFreeCutPointerMove(e) {
        if (studioState.freecut.mode !== 'lasso' || !studioState.freecut.isDrawing) return;
        const pt = getNormalizedCanvasPoint(e);
        if (!pt) return;

        if (e.cancelable && e.type && e.type.startsWith('touch')) {
            e.preventDefault();
        }

        const pts = studioState.freecut.points;
        const lastPt = pts[pts.length - 1];
        if (!lastPt || Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) > 0.006) {
            pts.push(pt);
            if (valFreeCutPoints) valFreeCutPoints.textContent = pts.length;
            renderStudioCanvas();
        }
    }

    function handleFreeCutPointerUp(e) {
        if (studioState.freecut.mode === 'lasso' && studioState.freecut.isDrawing) {
            studioState.freecut.isDrawing = false;
            if (studioCanvas) studioCanvas.classList.remove('is-freecut-drawing');
            if (studioState.freecut.points.length >= 3) {
                studioState.freecut.isClosed = true;
            }
            if (valFreeCutPoints) valFreeCutPoints.textContent = studioState.freecut.points.length;
            renderStudioCanvas();
        }
    }

    function handleFreeChopPointerDown(e) {
        if (!studioCanvas || !studioState.sourceImg) return;
        const rect = studioCanvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const canvasX = (clientX - rect.left) * (studioCanvas.width / rect.width);
        const canvasY = (clientY - rect.top) * (studioCanvas.height / rect.height);

        const hit = hitTestFreeChop(canvasX, canvasY, studioCanvas.width, studioCanvas.height, studioState.cropMargins, studioCanvas.width / rect.width);

        studioState.freeChop.draggingHandle = hit.type === 'handle' ? hit.handle : null;
        studioState.freeChop.isMovingBox = hit.type === 'box';
        studioState.freeChop.isDrawingBox = hit.type === 'outside';
        studioState.freeChop.dragStart = { x: canvasX, y: canvasY };
        studioState.freeChop.initialMargins = { ...studioState.cropMargins };

        if (e.cancelable && e.type && e.type.startsWith('touch')) {
            e.preventDefault();
        }
    }

    function handleFreeChopPointerMove(e) {
        if (!studioCanvas || !studioState.sourceImg) return;
        const rect = studioCanvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const canvasX = (clientX - rect.left) * (studioCanvas.width / rect.width);
        const canvasY = (clientY - rect.top) * (studioCanvas.height / rect.height);

        const cW = studioCanvas.width;
        const cH = studioCanvas.height;

        // 1. Dragging a specific handle
        if (studioState.freeChop.draggingHandle) {
            if (e.cancelable && e.type && e.type.startsWith('touch')) {
                e.preventDefault();
            }

            const h = studioState.freeChop.draggingHandle;

            // Left edge or corners
            if (h === 'l' || h === 'tl' || h === 'bl') {
                const maxLeft = 100 - studioState.cropMargins.right - 10;
                const newLeft = Math.max(0, Math.min(Math.min(45, maxLeft), Math.round((canvasX / cW) * 100)));
                studioState.cropMargins.left = newLeft;
            }
            // Right edge or corners
            if (h === 'r' || h === 'tr' || h === 'br') {
                const maxRight = 100 - studioState.cropMargins.left - 10;
                const newRight = Math.max(0, Math.min(Math.min(45, maxRight), Math.round(((cW - canvasX) / cW) * 100)));
                studioState.cropMargins.right = newRight;
            }
            // Top edge or corners
            if (h === 't' || h === 'tl' || h === 'tr') {
                const maxTop = 100 - studioState.cropMargins.bottom - 10;
                const newTop = Math.max(0, Math.min(Math.min(45, maxTop), Math.round((canvasY / cH) * 100)));
                studioState.cropMargins.top = newTop;
            }
            // Bottom edge or corners
            if (h === 'b' || h === 'bl' || h === 'br') {
                const maxBottom = 100 - studioState.cropMargins.top - 10;
                const newBottom = Math.max(0, Math.min(Math.min(45, maxBottom), Math.round(((cH - canvasY) / cH) * 100)));
                studioState.cropMargins.bottom = newBottom;
            }

            syncCropMarginUI();
            renderStudioCanvas();
            return;
        }

        // 2. Moving the whole crop box
        if (studioState.freeChop.isMovingBox && studioState.freeChop.dragStart && studioState.freeChop.initialMargins) {
            if (e.cancelable && e.type && e.type.startsWith('touch')) {
                e.preventDefault();
            }

            const deltaX = canvasX - studioState.freeChop.dragStart.x;
            const deltaY = canvasY - studioState.freeChop.dragStart.y;
            const shiftPctX = Math.round((deltaX / cW) * 100);
            const shiftPctY = Math.round((deltaY / cH) * 100);

            const init = studioState.freeChop.initialMargins;
            let newLeft = init.left + shiftPctX;
            let newRight = init.right - shiftPctX;
            let newTop = init.top + shiftPctY;
            let newBottom = init.bottom - shiftPctY;

            if (newLeft < 0) { newRight += newLeft; newLeft = 0; }
            if (newRight < 0) { newLeft += newRight; newRight = 0; }
            if (newTop < 0) { newBottom += newTop; newTop = 0; }
            if (newBottom < 0) { newTop += newBottom; newBottom = 0; }

            studioState.cropMargins.left = Math.max(0, Math.min(45, newLeft));
            studioState.cropMargins.right = Math.max(0, Math.min(45, newRight));
            studioState.cropMargins.top = Math.max(0, Math.min(45, newTop));
            studioState.cropMargins.bottom = Math.max(0, Math.min(45, newBottom));

            syncCropMarginUI();
            renderStudioCanvas();
            return;
        }

        // 3. Drawing new rectangle by dragging on canvas
        if (studioState.freeChop.isDrawingBox && studioState.freeChop.dragStart) {
            if (e.cancelable && e.type && e.type.startsWith('touch')) {
                e.preventDefault();
            }

            const startX = studioState.freeChop.dragStart.x;
            const startY = studioState.freeChop.dragStart.y;
            const minX = Math.min(startX, canvasX);
            const maxX = Math.max(startX, canvasX);
            const minY = Math.min(startY, canvasY);
            const maxY = Math.max(startY, canvasY);

            if (maxX - minX > 20 && maxY - minY > 20) {
                studioState.cropMargins.left = Math.max(0, Math.min(45, Math.round((minX / cW) * 100)));
                studioState.cropMargins.right = Math.max(0, Math.min(45, Math.round(((cW - maxX) / cW) * 100)));
                studioState.cropMargins.top = Math.max(0, Math.min(45, Math.round((minY / cH) * 100)));
                studioState.cropMargins.bottom = Math.max(0, Math.min(45, Math.round(((cH - maxY) / cH) * 100)));

                syncCropMarginUI();
                renderStudioCanvas();
            }
            return;
        }

        // 4. Hover Mode: update mouse cursor over handles or box
        const hit = hitTestFreeChop(canvasX, canvasY, cW, cH, studioState.cropMargins, cW / rect.width);
        studioCanvas.style.cursor = hit.cursor;
    }

    function handleFreeChopPointerUp() {
        studioState.freeChop.draggingHandle = null;
        studioState.freeChop.isMovingBox = false;
        studioState.freeChop.isDrawingBox = false;
    }

    function handleCanvasPointerDown(e) {
        if (!studioState.sourceImg || !studioCanvas) return;

        const activeTabContent = document.querySelector('.studio-tab-content.active');
        const isChopFreeTab = activeTabContent && activeTabContent.id === 'tabContentChopFree';
        const isFreeCut = isChopFreeTab && studioState.cropShape === 'freecut';
        const isFreeChop = isChopFreeTab && studioState.cropShape !== 'freecut';

        if (isFreeCut) {
            handleFreeCutPointerDown(e);
            return;
        }

        if (isFreeChop) {
            handleFreeChopPointerDown(e);
            return;
        }

        const isTextTab = activeTabContent && activeTabContent.id === 'tabContentText';
        const hasText = studioState.text.content && studioState.text.content.trim().length > 0;

        const isOverlayTab = activeTabContent && activeTabContent.id === 'tabContentOverlay';
        const hasOverlay = !!studioState.overlay.img;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (isTextTab && hasText) {
            studioState.isDraggingText = true;
            studioCanvas.classList.add('is-dragging');
            updateTextPositionFromEvent(e);
        } else if (isOverlayTab && hasOverlay) {
            studioState.isDraggingOverlay = true;
            studioCanvas.classList.add('is-dragging');
            updateOverlayPositionFromEvent(e);
        } else {
            // Interactive Photo Framing Pan within Crop/Chop window
            studioState.isPanningPhoto = true;
            studioState.panStart = { x: clientX, y: clientY };
            studioState.panInitialState = { x: studioState.cropPan.x, y: studioState.cropPan.y };
            studioCanvas.classList.add('is-panning');
            if (e.cancelable && e.type.startsWith('touch')) {
                e.preventDefault();
            }
        }
    }

    function handleCanvasPointerMove(e) {
        if (studioState.cropShape === 'freecut' && studioState.freecut.isDrawing) {
            handleFreeCutPointerMove(e);
            return;
        }

        const activeTabContent = document.querySelector('.studio-tab-content.active');
        const isChopFreeTab = activeTabContent && activeTabContent.id === 'tabContentChopFree';
        const isFreeChop = isChopFreeTab && studioState.cropShape !== 'freecut';

        if (isFreeChop) {
            handleFreeChopPointerMove(e);
            return;
        }

        if (studioState.isDraggingText) {
            updateTextPositionFromEvent(e);
            return;
        }

        if (studioState.isDraggingOverlay) {
            updateOverlayPositionFromEvent(e);
            return;
        }

        if (!studioState.isPanningPhoto || !studioCanvas || !studioState.sourceImg) return;

        if (e.cancelable && e.type.startsWith('touch')) {
            e.preventDefault();
        }

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaScreenX = clientX - studioState.panStart.x;
        const deltaScreenY = clientY - studioState.panStart.y;

        const rect = studioCanvas.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) return;

        // Calculate current oriented and cropped dimensions
        const img = studioState.sourceImg;
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const isSideways = studioState.rotation === 90 || studioState.rotation === 270;
        const rotW = isSideways ? origH : origW;
        const rotH = isSideways ? origW : origH;

        let ratioW = rotW;
        let ratioH = rotH;
        if (studioState.aspectRatio !== 'free' && !studioState.extrudeSquare) {
            let targetRatio = 1;
            if (studioState.aspectRatio === '1920:1080') {
                targetRatio = 1920 / 1080;
            } else {
                const parts = studioState.aspectRatio.split(':').map(Number);
                targetRatio = parts[0] / parts[1];
            }
            const currentRatio = rotW / rotH;
            if (currentRatio > targetRatio) {
                ratioH = rotH;
                ratioW = Math.round(rotH * targetRatio);
            } else {
                ratioW = rotW;
                ratioH = Math.round(rotW / targetRatio);
            }
        }

        const mTop = Math.round(ratioH * (studioState.cropMargins.top / 100));
        const mBottom = Math.round(ratioH * (studioState.cropMargins.bottom / 100));
        const mLeft = Math.round(ratioW * (studioState.cropMargins.left / 100));
        const mRight = Math.round(ratioW * (studioState.cropMargins.right / 100));

        const croppedW = Math.max(30, ratioW - mLeft - mRight);
        const croppedH = Math.max(30, ratioH - mTop - mBottom);

        const zoom = Math.max(0.1, Math.min(3.0, (studioState.cropZoom || 100) / 100));
        const drawW = Math.round((isSideways ? origH : origW) * zoom);
        const drawH = Math.round((isSideways ? origW : origH) * zoom);

        const availSlackX = Math.max(0, (drawW - croppedW) / 2);
        const availSlackY = Math.max(0, (drawH - croppedH) / 2);

        const effectiveSlackX = availSlackX > 0 ? availSlackX : Math.round(croppedW * 0.4);
        const effectiveSlackY = availSlackY > 0 ? availSlackY : Math.round(croppedH * 0.4);

        // Scale factor: display to internal cropped pixels
        const scaleFactorX = croppedW / rect.width;
        const scaleFactorY = croppedH / rect.height;

        const deltaCanvasX = deltaScreenX * scaleFactorX;
        const deltaCanvasY = deltaScreenY * scaleFactorY;

        const deltaPercentX = effectiveSlackX > 0 ? (deltaCanvasX / effectiveSlackX) * 100 : 0;
        const deltaPercentY = effectiveSlackY > 0 ? (deltaCanvasY / effectiveSlackY) * 100 : 0;

        // Dragging right pulls photo right -> frames towards Left (-100)
        const newPanX = Math.max(-100, Math.min(100, Math.round(studioState.panInitialState.x - deltaPercentX)));
        // Dragging down pulls photo down -> frames towards Top (-100)
        const newPanY = Math.max(-100, Math.min(100, Math.round(studioState.panInitialState.y - deltaPercentY)));

        studioState.cropPan.x = newPanX;
        studioState.cropPan.y = newPanY;

        // Synchronize UI
        if (rangeCropPanX) rangeCropPanX.value = newPanX;
        if (valCropPanX) valCropPanX.textContent = `${newPanX}%`;
        if (rangeCropPanY) rangeCropPanY.value = newPanY;
        if (valCropPanY) valCropPanY.textContent = `${newPanY}%`;

        document.querySelectorAll('.pan-quick-btn').forEach(b => {
            const bx = parseInt(b.dataset.panX, 10);
            const by = parseInt(b.dataset.panY, 10);
            b.classList.toggle('active', bx === newPanX && by === newPanY);
        });

        renderStudioCanvas();
    }

    function handleCanvasPointerUp(e) {
        if (studioState.cropShape === 'freecut' && studioState.freecut.isDrawing) {
            handleFreeCutPointerUp(e);
        }

        const activeTabContent = document.querySelector('.studio-tab-content.active');
        const isChopFreeTab = activeTabContent && activeTabContent.id === 'tabContentChopFree';
        if (isChopFreeTab && studioState.cropShape !== 'freecut') {
            handleFreeChopPointerUp();
        }

        studioState.isDraggingText = false;
        studioState.isDraggingOverlay = false;
        studioState.isPanningPhoto = false;
        if (studioCanvas) {
            studioCanvas.classList.remove('is-dragging');
            studioCanvas.classList.remove('is-panning');
            studioCanvas.style.cursor = '';
        }
    }

    function updateTextPositionFromEvent(e) {
        if (!studioCanvas) return;
        const rect = studioCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const relX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
        const relY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));

        studioState.text.x = relX;
        studioState.text.y = relY;
        renderStudioCanvas();
    }

    function updateOverlayPositionFromEvent(e) {
        if (!studioCanvas || !studioState.overlay.img) return;
        const rect = studioCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const relX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
        const relY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));

        studioState.overlay.x = relX;
        studioState.overlay.y = relY;

        const pctX = Math.round(relX * 100);
        const pctY = Math.round(relY * 100);

        const rangeOverlayPosX = document.getElementById('rangeOverlayPosX');
        const valOverlayPosX = document.getElementById('valOverlayPosX');
        const rangeOverlayPosY = document.getElementById('rangeOverlayPosY');
        const valOverlayPosY = document.getElementById('valOverlayPosY');

        if (rangeOverlayPosX) rangeOverlayPosX.value = pctX;
        if (valOverlayPosX) valOverlayPosX.textContent = `${pctX}%`;
        if (rangeOverlayPosY) rangeOverlayPosY.value = pctY;
        if (valOverlayPosY) valOverlayPosY.textContent = `${pctY}%`;

        document.querySelectorAll('.overlay-align-btn').forEach(btn => btn.classList.remove('active'));

        renderStudioCanvas();
    }

    if (studioCanvas) {
        studioCanvas.addEventListener('mousedown', handleCanvasPointerDown);
        window.addEventListener('mousemove', handleCanvasPointerMove);
        window.addEventListener('mouseup', handleCanvasPointerUp);

        studioCanvas.addEventListener('touchstart', handleCanvasPointerDown, { passive: false });
        window.addEventListener('touchmove', handleCanvasPointerMove, { passive: false });
        window.addEventListener('touchend', handleCanvasPointerUp);
        window.addEventListener('touchcancel', handleCanvasPointerUp);

        // Mouse wheel zoom on canvas in Crop mode
        studioCanvas.addEventListener('wheel', (e) => {
            if (!studioState.sourceImg) return;
            const activeTabContent = document.querySelector('.studio-tab-content.active');
            const isTextTab = activeTabContent && activeTabContent.id === 'tabContentText';
            const isOverlayTab = activeTabContent && activeTabContent.id === 'tabContentOverlay';
            if (isTextTab || isOverlayTab) return;

            e.preventDefault();
            const delta = e.deltaY < 0 ? 8 : -8;
            const currentZoom = studioState.cropZoom || 100;
            setCropZoom(currentZoom + delta);
        }, { passive: false });
    }

    // Apply Changes back to Current Workflow View
    if (btnStudioApply) {
        btnStudioApply.addEventListener('click', () => {
            if (!studioCanvas) return;

            renderStudioCanvas({ exportMode: true });
            const editedDataUrl = studioCanvas.toDataURL('image/png');

            if (studioState.mode === 'original') {
                selectedDataUrl = editedDataUrl;
                if (previewImg) previewImg.src = editedDataUrl;

                studioCanvas.toBlob((blob) => {
                    if (blob) {
                        const originalName = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'edited-image';
                        selectedFile = new File([blob], `${originalName}-edited.png`, { type: 'image/png' });
                        if (previewSize) previewSize.textContent = formatFileSize(blob.size);
                    }
                }, 'image/png');

            } else if (studioState.mode === 'result') {
                if (processedResultImg) processedResultImg.src = editedDataUrl;
                const isInsideCutout = studioState.cutoutType === 'inside';
                if (btnDownload) {
                    btnDownload.href = editedDataUrl;
                    btnDownload.download = isInsideCutout ? 'removed-inside-edited.png' : 'no-bg-edited.png';
                }
            }

            closeImageStudio();
        });
    }

    // Direct Download from Studio
    if (btnStudioDownload) {
        btnStudioDownload.addEventListener('click', () => {
            if (!studioCanvas) return;

            renderStudioCanvas({ exportMode: true });
            const downloadUrl = studioCanvas.toDataURL('image/png');
            renderStudioCanvas();

            const link = document.createElement('a');
            const isInsideCutout = studioState.cutoutType === 'inside';
            const defaultName = studioState.mode === 'result' 
                ? (isInsideCutout ? 'removed-inside-edited.png' : 'no-bg-edited.png') 
                : 'edited-image.png';
            link.download = defaultName;
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});

