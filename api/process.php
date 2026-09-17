<?php
/**
 * ClearCut - Image Processing API Endpoint
 *
 * Handles file validation, upload, Pixelcut AI API communication,
 * result storage, and temporary file cleanup.
 */

// Disable direct HTML error output to maintain valid JSON response
ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../config.php';

// Helper function to return JSON response and exit
function send_json_response(bool $success, string $message, array $extra = []): void {
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $extra));
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    send_json_response(false, 'Method not allowed. Only POST requests are accepted.');
}

// Initialize working directories
initialize_directories();

// Lightweight garbage collection for temp files
cleanup_old_files(UPLOAD_DIR);
cleanup_old_files(OUTPUT_DIR);

// 1. Verify file was submitted
if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
    http_response_code(400);
    send_json_response(false, 'No image file was received. Please select an image.');
}

$file = $_FILES['image'];

// 2. Validate upload status
if ($file['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the maximum file size allowed by the form.',
        UPLOAD_ERR_PARTIAL    => 'The image was only partially uploaded. Please try again.',
        UPLOAD_ERR_NO_FILE    => 'No image was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary server folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write uploaded image to disk.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.'
    ];

    $errorMessage = $uploadErrors[$file['error']] ?? 'An unknown upload error occurred.';
    http_response_code(400);
    send_json_response(false, $errorMessage);
}

// 3. Validate file size (8MB max)
if ($file['size'] <= 0 || $file['size'] > MAX_FILE_SIZE) {
    http_response_code(400);
    send_json_response(false, 'File exceeds the ' . MAX_FILE_SIZE_MB . ' MB limit.');
}

// 4. Validate file extension
$originalName = $file['name'] ?? '';
$fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!in_array($fileExtension, ALLOWED_EXTENSIONS, true)) {
    http_response_code(400);
    send_json_response(false, 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP, GIF.');
}

// 5. Server-side MIME type inspection using Fileinfo
$tmpPath = $file['tmp_name'];
if (!is_uploaded_file($tmpPath)) {
    http_response_code(400);
    send_json_response(false, 'Security violation: uploaded file is invalid.');
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$detectedMime = $finfo ? finfo_file($finfo, $tmpPath) : '';
if ($finfo) {
    finfo_close($finfo);
}

if (!in_array($detectedMime, ALLOWED_MIME_TYPES, true)) {
    http_response_code(400);
    send_json_response(false, 'Invalid image format. The file content does not match an allowed image type.');
}

// 6. Verify image content using getimagesize
$imageInfo = @getimagesize($tmpPath);
if ($imageInfo === false || empty($imageInfo[0]) || empty($imageInfo[1])) {
    http_response_code(400);
    send_json_response(false, 'The image could not be read or is corrupted.');
}

// 7. Verify API Key is configured
if (empty(PIXELCUT_API_KEY) || PIXELCUT_API_KEY === 'YOUR_PIXELCUT_API_KEY_HERE') {
    http_response_code(500);
    send_json_response(false, 'Pixelcut API key is not configured. Please add your API key in config.php.');
}

// 8. Generate safe, random storage name for temporary file
$randomSuffix = bin2hex(random_bytes(16));
$safeFileName = 'upload_' . $randomSuffix . '.' . $fileExtension;
$uploadDestination = UPLOAD_DIR . $safeFileName;

if (!move_uploaded_file($tmpPath, $uploadDestination)) {
    http_response_code(500);
    send_json_response(false, 'The image upload failed. Could not store temporary file.');
}

// Function to safely cleanup temporary upload file
$cleanupUpload = function() use ($uploadDestination) {
    if (file_exists($uploadDestination)) {
        @unlink($uploadDestination);
    }
};

try {
    // 9. Call Pixelcut Background Removal API via cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, PIXELCUT_API_ENDPOINT);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    configure_curl_ssl($ch);

    // Determine whether to use public image_url or direct multipart upload:
    // If public internet host: provide public URL.
    // If localhost/private IP: use direct multipart file upload so Pixelcut doesn't fail resolving localhost.
    $isLocal = is_local_environment();
    $publicImageUrl = get_base_url() . 'uploads/' . $safeFileName;

    $headers = [
        'X-API-KEY: ' . PIXELCUT_API_KEY,
        'Accept: application/json'
    ];

    if (!$isLocal) {
        // Public domain / Shared hosting: use JSON payload with image_url
        $headers[] = 'Content-Type: application/json';
        $payload = json_encode([
            'image_url' => $publicImageUrl,
            'format' => 'png'
        ]);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    } else {
        // Local environment (localhost/XAMPP): upload image directly via multipart form
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $cfile = new CURLFile($uploadDestination, $detectedMime, $safeFileName);
        $postFields = [
            'image' => $cfile,
            'format' => 'png'
        ];
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    }

    $apiResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // If request failed with network or SSL issue
    if ($apiResponse === false || !empty($curlError)) {
        $cleanupUpload();
        http_response_code(502);
        $msg = 'Unable to connect to Pixelcut. ';
        if (str_contains($curlError, 'certificate') || str_contains($curlError, 'SSL')) {
            $msg .= 'SSL verification failed on server. (Error: ' . $curlError . ')';
        } else {
            $msg .= 'Please check your network connection or firewall settings.';
        }
        send_json_response(false, $msg);
    }

    // 10. Handle API HTTP status codes
    if ($httpCode === 401 || $httpCode === 403) {
        $cleanupUpload();
        http_response_code(401);
        send_json_response(false, 'Invalid Pixelcut API key. Please check your API key in config.php.');
    } elseif ($httpCode === 402) {
        $cleanupUpload();
        http_response_code(402);
        send_json_response(false, 'Pixelcut API credits exhausted. Please check your Pixelcut account plan.');
    } elseif ($httpCode === 429) {
        $cleanupUpload();
        http_response_code(429);
        send_json_response(false, 'Pixelcut API rate limit reached. Please wait a moment and try again.');
    } elseif ($httpCode < 200 || $httpCode >= 300) {
        $cleanupUpload();
        http_response_code(502);
        $detail = '';
        if (!empty($apiResponse)) {
            $errJson = json_decode($apiResponse, true);
            if (is_array($errJson) && !empty($errJson['error'])) {
                $detail = ' (' . $errJson['error'] . ')';
            }
        }
        send_json_response(false, 'Pixelcut API request failed (HTTP ' . $httpCode . ')' . $detail . '. Please try again.');
    }

    // 11. Decode JSON response
    $responseData = json_decode($apiResponse, true);
    if (!is_array($responseData) || empty($responseData['result_url'])) {
        $cleanupUpload();
        http_response_code(502);
        send_json_response(false, 'Background removal failed. Pixelcut returned an unexpected response format.');
    }

    $resultUrl = $responseData['result_url'];

    // 12. Retrieve the generated PNG from Pixelcut result_url
    // Validate that resultUrl is a secure https URL
    if (!filter_var($resultUrl, FILTER_VALIDATE_URL) || !str_starts_with(strtolower($resultUrl), 'https://')) {
        $cleanupUpload();
        http_response_code(502);
        send_json_response(false, 'Invalid result URL returned by AI service.');
    }

    $chDownload = curl_init();
    curl_setopt($chDownload, CURLOPT_URL, $resultUrl);
    curl_setopt($chDownload, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chDownload, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($chDownload, CURLOPT_TIMEOUT, 45);
    configure_curl_ssl($chDownload);

    $pngData = curl_exec($chDownload);
    $downloadError = curl_error($chDownload);
    $downloadHttpCode = curl_getinfo($chDownload, CURLINFO_HTTP_CODE);
    curl_close($chDownload);

    if ($pngData === false || $downloadHttpCode !== 200 || empty($pngData)) {
        $cleanupUpload();
        http_response_code(502);
        send_json_response(false, 'The result could not be generated. Unable to retrieve processed image.');
    }

    // 13. Verify the retrieved binary is a valid PNG image (Check PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A)
    $pngMagicBytes = "\x89PNG\r\n\x1a\n";
    if (!str_starts_with($pngData, $pngMagicBytes)) {
        $cleanupUpload();
        http_response_code(502);
        send_json_response(false, 'The result file returned is not a valid PNG image.');
    }

    // 14. Generate safe result identifier and store in outputs/
    $resultId = bin2hex(random_bytes(16)); // 32 hex chars
    $outputFileName = $resultId . '.png';
    $outputFilePath = OUTPUT_DIR . $outputFileName;

    if (file_put_contents($outputFilePath, $pngData, LOCK_EX) === false) {
        $cleanupUpload();
        http_response_code(500);
        send_json_response(false, 'Failed to save processed image on server.');
    }

    // 15. Generate 'Remove Inside' (Reverse cutout: keep background, transparent subject)
    $hasInside = false;
    try {
        if (extension_loaded('gd') && file_exists($uploadDestination)) {
            $origImg = @imagecreatefromstring(file_get_contents($uploadDestination));
            $cutoutImg = @imagecreatefromstring($pngData);

            if ($origImg !== false && $cutoutImg !== false) {
                $w = imagesx($cutoutImg);
                $h = imagesy($cutoutImg);

                // Scale original image if dimensions differ from cutout
                $origW = imagesx($origImg);
                $origH = imagesy($origImg);
                if ($origW !== $w || $origH !== $h) {
                    $scaledOrig = imagecreatetruecolor($w, $h);
                    imagesavealpha($scaledOrig, true);
                    imagealphablending($scaledOrig, false);
                    $transColor = imagecolorallocatealpha($scaledOrig, 0, 0, 0, 127);
                    imagefill($scaledOrig, 0, 0, $transColor);
                    imagecopyresampled($scaledOrig, $origImg, 0, 0, 0, 0, $w, $h, $origW, $origH);
                    imagedestroy($origImg);
                    $origImg = $scaledOrig;
                }

                $insideImg = imagecreatetruecolor($w, $h);
                imagesavealpha($insideImg, true);
                imagealphablending($insideImg, false);
                $transColor = imagecolorallocatealpha($insideImg, 0, 0, 0, 127);
                imagefill($insideImg, 0, 0, $transColor);

                for ($y = 0; $y < $h; $y++) {
                    for ($x = 0; $x < $w; $x++) {
                        $rgbaCut = imagecolorat($cutoutImg, $x, $y);
                        $alphaCut = ($rgbaCut >> 24) & 0x7F; // 0 = opaque in GD, 127 = transparent in GD
                        
                        $rgbaOrig = imagecolorat($origImg, $x, $y);
                        $r = ($rgbaOrig >> 16) & 0xFF;
                        $g = ($rgbaOrig >> 8) & 0xFF;
                        $b = $rgbaOrig & 0xFF;
                        $alphaOrig = ($rgbaOrig >> 24) & 0x7F;

                        // Invert mask: subject (alphaCut=0) -> transparent (127); background (alphaCut=127) -> opaque (0)
                        $invertedAlpha = 127 - $alphaCut;
                        $finalAlpha = max($alphaOrig, $invertedAlpha);

                        $pixelColor = imagecolorallocatealpha($insideImg, $r, $g, $b, $finalAlpha);
                        imagesetpixel($insideImg, $x, $y, $pixelColor);
                    }
                }

                $insideOutputFilePath = OUTPUT_DIR . $resultId . '_inside.png';
                if (imagepng($insideImg, $insideOutputFilePath, 6)) {
                    $hasInside = true;
                }

                imagedestroy($insideImg);
                imagedestroy($cutoutImg);
                imagedestroy($origImg);
            }
        }
    } catch (\Throwable $e) {
        // Continue gracefully even if reverse mask generation fails
        error_log('Inside removal generation error: ' . $e->getMessage());
    }

    // 16. Delete temporary upload file now that processing succeeded
    $cleanupUpload();

    // 17. Return safe result identifier
    http_response_code(200);
    send_json_response(true, 'Background removed successfully.', [
        'result' => $resultId,
        'has_inside' => $hasInside
    ]);

} catch (\Throwable $e) {
    $cleanupUpload();
    http_response_code(500);
    send_json_response(false, 'An unexpected server error occurred during processing.');
}
