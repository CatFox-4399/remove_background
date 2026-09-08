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

    // DOM Elements - Processing State
    const processingCard = document.getElementById('processingCard');
    const processingStatusText = document.getElementById('processingStatusText');

    // DOM Elements - Result Section
    const resultSection = document.getElementById('resultSection');
    const originalResultImg = document.getElementById('originalResultImg');
    const processedResultImg = document.getElementById('processedResultImg');
    const btnUploadAnother = document.getElementById('btnUploadAnother');
    const btnDownload = document.getElementById('btnDownload');

    // DOM Elements - Alerts
    const errorAlert = document.getElementById('errorAlert');
    const errorMessageText = document.getElementById('errorMessageText');
    const btnCloseAlert = document.getElementById('btnCloseAlert');

    // Application State
    let selectedFile = null;
    let selectedDataUrl = null;
    let isProcessing = false;
    let stageInterval = null;

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

        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = '';
        if (previewCard) previewCard.classList.remove('show');
        if (processingCard) processingCard.classList.remove('show');
        if (resultSection) resultSection.classList.remove('show');
        if (dropzone) dropzone.style.display = 'block';

        if (btnProcess) btnProcess.disabled = false;
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
                displayResult(resultId);

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
     * Render the processed result side-by-side
     */
    function displayResult(resultId) {
        isProcessing = false;

        if (processingCard) processingCard.classList.remove('show');

        // Set original image preview
        if (originalResultImg && selectedDataUrl) {
            originalResultImg.src = selectedDataUrl;
        }

        // Set processed image preview via download endpoint with preview=1
        const previewUrl = `api/download.php?id=${encodeURIComponent(resultId)}&preview=1`;
        if (processedResultImg) {
            processedResultImg.src = previewUrl;
        }

        // Configure Download button
        if (btnDownload) {
            btnDownload.href = `api/download.php?id=${encodeURIComponent(resultId)}`;
        }

        // Show result section
        if (resultSection) {
            resultSection.classList.add('show');
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

    const valBrightness = document.getElementById('valBrightness');
    const valContrast = document.getElementById('valContrast');
    const valSaturation = document.getElementById('valSaturation');
    const valVignette = document.getElementById('valVignette');

    // Freeform Crop Margin Controls
    const rangeCropTop = document.getElementById('rangeCropTop');
    const rangeCropBottom = document.getElementById('rangeCropBottom');
    const rangeCropLeft = document.getElementById('rangeCropLeft');
    const rangeCropRight = document.getElementById('rangeCropRight');

    const valCropTop = document.getElementById('valCropTop');
    const valCropBottom = document.getElementById('valCropBottom');
    const valCropLeft = document.getElementById('valCropLeft');
    const valCropRight = document.getElementById('valCropRight');

    // Resize Elements
    const inputResizeWidth = document.getElementById('inputResizeWidth');
    const inputResizeHeight = document.getElementById('inputResizeHeight');
    const btnLockAspect = document.getElementById('btnLockAspect');
    const origDimIndicator = document.getElementById('origDimIndicator');

    // Text Overlay Elements
    const studioTextInput = document.getElementById('studioTextInput');
    const selectFontFamily = document.getElementById('selectFontFamily');
    const rangeFontSize = document.getElementById('rangeFontSize');
    const valFontSize = document.getElementById('valFontSize');
    const inputTextColor = document.getElementById('inputTextColor');
    // Outline elements
    const btnTextOutline = document.getElementById('btnTextOutline');
    const statusTextOutline = document.getElementById('statusTextOutline');
    const outlineBody = document.getElementById('outlineBody');
    const inputOutlineColor = document.getElementById('inputOutlineColor');
    const rangeOutlineWidth = document.getElementById('rangeOutlineWidth');
    const valOutlineWidth = document.getElementById('valOutlineWidth');
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
        cropShape: 'rect', // 'rect', 'circle', 'rounded', 'heart', 'star'
        cropMargins: { top: 0, bottom: 0, left: 0, right: 0 },
        activeFilter: 'normal',
        vignette: 0,      // 0 to 100
        brightness: 0,
        contrast: 0,
        saturation: 0,
        extrudeSquare: false, // Stretch whole image into 1:1 square without cutting
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
            bold: true,
            italic: false,
            outline: true,
            outlineColor: '#000000',
            outlineWidth: 4,
            glow: false,
            glowColor: '#0ea5e9',
            glowBlur: 14,
            x: 0.5,       // relative 0 to 1
            y: 0.85       // relative 0 to 1
        },
        isDraggingText: false
    };

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
        } else {
            ctx.rect(x, y, w, h);
        }
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
        studioState.activeFilter = 'normal';
        studioState.vignette = 0;
        studioState.brightness = 0;
        studioState.contrast = 0;
        studioState.saturation = 0;
        studioState.extrudeSquare = false;
        studioState.resize.customWidth = 0;
        studioState.resize.customHeight = 0;
        studioState.resize.hasCustomResize = false;
        if (typeof updateExtrudeUI === 'function') updateExtrudeUI();
        studioState.text.content = '';
        studioState.text.font = 'sans-serif';
        studioState.text.size = 36;
        studioState.text.color = '#ffffff';
        studioState.text.bold = true;
        studioState.text.italic = false;
        studioState.text.outline = true;
        studioState.text.outlineColor = '#000000';
        studioState.text.outlineWidth = 4;
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

        if (rangeCropTop) rangeCropTop.value = 0;
        if (rangeCropBottom) rangeCropBottom.value = 0;
        if (rangeCropLeft) rangeCropLeft.value = 0;
        if (rangeCropRight) rangeCropRight.value = 0;
        if (valCropTop) valCropTop.textContent = '0%';
        if (valCropBottom) valCropBottom.textContent = '0%';
        if (valCropLeft) valCropLeft.textContent = '0%';
        if (valCropRight) valCropRight.textContent = '0%';

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
        if (inputTextColor) inputTextColor.value = '#ffffff';
        if (btnTextBold) btnTextBold.classList.add('active');
        if (btnTextItalic) btnTextItalic.classList.remove('active');

        // Reset Outline UI
        if (btnTextOutline) btnTextOutline.classList.add('active');
        if (statusTextOutline) statusTextOutline.textContent = 'ON';
        if (outlineBody) outlineBody.style.display = 'flex';
        if (inputOutlineColor) inputOutlineColor.value = '#000000';
        if (rangeOutlineWidth) rangeOutlineWidth.value = 4;
        if (valOutlineWidth) valOutlineWidth.textContent = '4px';

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
        if (typeof switchStudioCategory === 'function') switchStudioCategory('core');
    }

    /**
     * Open Image Studio with specified image source and mode
     */
    function openImageStudio(imageSrc, mode) {
        if (!imageSrc) return;

        studioState.mode = mode;

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
            case 'vignette':
                baseFilters += ' contrast(115%)';
                break;
            default:
                break;
        }

        return baseFilters;
    }

    /**
     * Render the transformed, cropped, shaped, and filtered image onto the canvas
     */
    function renderStudioCanvas() {
        if (!studioState.sourceImg || !studioCanvas) return;

        const img = studioState.sourceImg;
        const ctx = studioCanvas.getContext('2d');
        if (!ctx) return;

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
            const parts = studioState.aspectRatio.split(':').map(Number);
            const targetRatio = parts[0] / parts[1];
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

        // Determine Final Target Dimensions:
        // CROP / CHOP ONLY CUTS THE PICTURE (NEVER EXTRUDES OR STRETCHES IT).
        // Final canvas dimensions match the cropped size 1:1 unless the user explicitly used the Resize tool.
        let finalW = croppedW;
        let finalH = croppedH;

        if (studioState.resize.hasCustomResize && studioState.resize.customWidth > 20 && studioState.resize.customHeight > 20) {
            finalW = studioState.resize.customWidth;
            finalH = studioState.resize.customHeight;
            if (origDimIndicator) {
                origDimIndicator.textContent = `${croppedW} × ${croppedH} px → ${finalW} × ${finalH} px`;
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

        // Step 1: Render intermediate unscaled cropped image to an offscreen canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = croppedW;
        offCanvas.height = croppedH;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        offCtx.clearRect(0, 0, croppedW, croppedH);

        // Clip to Shape Mask if selected
        if (studioState.cropShape !== 'rect') {
            createShapePath(offCtx, studioState.cropShape, 0, 0, croppedW, croppedH);
            offCtx.clip();
        }

        // Apply Color Filters & Smoothing
        offCtx.filter = getFilterString();
        offCtx.imageSmoothingEnabled = true;
        offCtx.imageSmoothingQuality = 'high';

        // Draw Transformed Image with Center Alignment
        offCtx.save();
        offCtx.translate(croppedW / 2 + (mRight - mLeft) / 2, croppedH / 2 + (mBottom - mTop) / 2);
        offCtx.rotate((studioState.rotation * Math.PI) / 180);

        const scaleX = studioState.flipH ? -1 : 1;
        const scaleY = studioState.flipV ? -1 : 1;
        offCtx.scale(scaleX, scaleY);

        if (studioState.extrudeSquare) {
            // Extrude entire picture into square dimensions (no clipping of content)
            const drawW = isSideways ? ratioH : ratioW;
            const drawH = isSideways ? ratioW : ratioH;
            offCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            offCtx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
        }
        offCtx.restore();

        // Step 2: Draw Vignette (Edge Shading) if active
        if (studioState.vignette > 0) {
            offCtx.save();
            if (studioState.cropShape !== 'rect') {
                createShapePath(offCtx, studioState.cropShape, 0, 0, croppedW, croppedH);
                offCtx.clip();
            }
            const radius = Math.max(croppedW, croppedH) * 0.72;
            const grad = offCtx.createRadialGradient(
                croppedW / 2, croppedH / 2, radius * 0.35,
                croppedW / 2, croppedH / 2, radius
            );
            const alpha = (studioState.vignette / 100) * 0.88;
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.7, `rgba(0, 0, 0, ${alpha * 0.4})`);
            grad.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);

            offCtx.fillStyle = grad;
            offCtx.fillRect(0, 0, croppedW, croppedH);
            offCtx.restore();
        }

        // Step 3: Draw Text Overlay if present
        if (studioState.text.content.trim().length > 0) {
            offCtx.save();
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

            // 2. Draw Outline if active (crisp rounded outer stroke)
            if (studioState.text.outline) {
                offCtx.save();
                offCtx.shadowColor = 'transparent';
                offCtx.strokeStyle = studioState.text.outlineColor;
                const strokeW = Math.max(1, Math.round(studioState.text.outlineWidth * (croppedW / 600)));
                offCtx.lineWidth = strokeW;
                offCtx.lineJoin = 'round';
                offCtx.miterLimit = 2;
                offCtx.strokeText(studioState.text.content, textX, textY);
                offCtx.restore();
            }

            // 3. Fill Text with user's chosen word color on top
            offCtx.fillStyle = studioState.text.color;
            offCtx.fillText(studioState.text.content, textX, textY);
            offCtx.restore();
        }

        // Step 4: Transfer to Main Studio Canvas (scaled if resized)
        studioCanvas.width = finalW;
        studioCanvas.height = finalH;

        ctx.clearRect(0, 0, finalW, finalH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offCanvas, 0, 0, finalW, finalH);
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
        text: document.getElementById('tabContentText')
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

        // Update canvas cursor for text drag if text tab active
        if (studioCanvas) {
            studioCanvas.classList.toggle('dragging-text', targetTab === 'text');
        }
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
            // Clear extrude square & manual resize distortion
            studioState.extrudeSquare = false;
            updateExtrudeUI();
            studioState.resize.hasCustomResize = false;
            studioState.resize.customWidth = 0;
            studioState.resize.customHeight = 0;
            document.querySelectorAll('.scale-btn').forEach(b => b.classList.toggle('active', b.dataset.scale === '1.0'));
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
            renderStudioCanvas();
        });
    });

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

    // Bold & Italic
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

    // Canvas Interactive Text Dragging
    function handleCanvasPointerDown(e) {
        if (!studioState.text.content) return;
        studioState.isDraggingText = true;
        studioCanvas.classList.add('is-dragging');
        updateTextPositionFromEvent(e);
    }

    function handleCanvasPointerMove(e) {
        if (!studioState.isDraggingText) return;
        updateTextPositionFromEvent(e);
    }

    function handleCanvasPointerUp() {
        studioState.isDraggingText = false;
        if (studioCanvas) studioCanvas.classList.remove('is-dragging');
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

    if (studioCanvas) {
        studioCanvas.addEventListener('mousedown', handleCanvasPointerDown);
        window.addEventListener('mousemove', handleCanvasPointerMove);
        window.addEventListener('mouseup', handleCanvasPointerUp);

        studioCanvas.addEventListener('touchstart', handleCanvasPointerDown, { passive: true });
        window.addEventListener('touchmove', handleCanvasPointerMove, { passive: true });
        window.addEventListener('touchend', handleCanvasPointerUp);
    }

    // Apply Changes back to Current Workflow View
    if (btnStudioApply) {
        btnStudioApply.addEventListener('click', () => {
            if (!studioCanvas) return;

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
                if (btnDownload) {
                    btnDownload.href = editedDataUrl;
                    btnDownload.download = 'no-bg-edited.png';
                }
            }

            closeImageStudio();
        });
    }

    // Direct Download from Studio
    if (btnStudioDownload) {
        btnStudioDownload.addEventListener('click', () => {
            if (!studioCanvas) return;

            const downloadUrl = studioCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            const defaultName = studioState.mode === 'result' ? 'no-bg-edited.png' : 'edited-image.png';
            link.download = defaultName;
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});

