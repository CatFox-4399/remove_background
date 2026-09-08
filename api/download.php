<?php
/**
 * ClearCut - Image Download & Preview Endpoint
 *
 * Securely delivers processed PNG images from outputs/ directory.
 * Prevents directory traversal attacks and forces "no-bg.png" download filename.
 */

// Disable direct error output
ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/../config.php';

// 1. Retrieve and validate ID parameter
$id = $_GET['id'] ?? '';
$isPreview = isset($_GET['preview']) && ($_GET['preview'] === '1' || $_GET['preview'] === 'true');

// Identifier must be exactly 32 hexadecimal characters
if (empty($id) || !preg_match('/^[a-f0-9]{32}$/i', $id)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'The download file could not be found. Invalid result identifier.';
    exit;
}

// 2. Prevent directory traversal and locate file inside OUTPUT_DIR
$safeFileName = basename($id) . '.png';
$filePath = OUTPUT_DIR . $safeFileName;

// Ensure file exists and is a regular file
if (!is_file($filePath) || !file_exists($filePath)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'The download file could not be found.';
    exit;
}

// Canonical path verification: must reside inside OUTPUT_DIR
$realFilePath = realpath($filePath);
$realOutputDir = realpath(OUTPUT_DIR);

if ($realFilePath === false || $realOutputDir === false || !str_starts_with($realFilePath, $realOutputDir)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Access denied.';
    exit;
}

// 3. Confirm file is a genuine PNG
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = $finfo ? finfo_file($finfo, $realFilePath) : '';
if ($finfo) {
    finfo_close($finfo);
}

if ($mimeType !== 'image/png') {
    http_response_code(415);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'The requested file is not a valid PNG image.';
    exit;
}

// 4. Send appropriate headers
$fileSize = filesize($realFilePath);

header('Content-Type: image/png');
header('Content-Length: ' . $fileSize);
header('X-Content-Type-Options: nosniff');

if ($isPreview) {
    // Render inline for browser image preview
    header('Content-Disposition: inline; filename="no-bg.png"');
    header('Cache-Control: private, max-age=3600');
} else {
    // Force download with exact filename "no-bg.png"
    header('Content-Description: File Transfer');
    header('Content-Disposition: attachment; filename="no-bg.png"');
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
}

// 5. Output file binary cleanly
// Clear output buffers to prevent corrupting image stream
if (ob_get_level()) {
    ob_end_clean();
}

readfile($realFilePath);
exit;
