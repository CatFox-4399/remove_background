<?php
/**
 * ClearCut - Example Configuration Template
 * Copy this file to config.php and set your Pixelcut API Key.
 */

// Application Information
define('APP_NAME', 'ClearCut');
define('APP_TAGLINE', 'AI-Powered Image Background Removal');
define('APP_VERSION', '1.0.0');

/**
 * Pixelcut API Key Configuration
 * Replace the placeholder below with your key or set the PIXELCUT_API_KEY environment variable.
 */
$envApiKey = getenv('PIXELCUT_API_KEY');
define('PIXELCUT_API_KEY', !empty($envApiKey) ? $envApiKey : 'YOUR_PIXELCUT_API_KEY_HERE');

// Pixelcut API Endpoint
define('PIXELCUT_API_ENDPOINT', 'https://api.developer.pixelcut.ai/v1/remove-background');

// File Upload Constraints
define('MAX_FILE_SIZE', 15 * 1024 * 1024); // 15 MB
define('MAX_FILE_SIZE_MB', 15);

// Allowed Image Formats
define('ALLOWED_MIME_TYPES', [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
]);

define('ALLOWED_EXTENSIONS', [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'gif'
]);

// Directory Paths
define('UPLOAD_DIR', __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR);
define('OUTPUT_DIR', __DIR__ . DIRECTORY_SEPARATOR . 'outputs' . DIRECTORY_SEPARATOR);

// Temp file expiration in seconds (1 hour)
define('TEMP_FILE_LIFETIME', 3600);

/**
 * Ensure necessary directories exist and are writable
 */
function initialize_directories(): void {
    foreach ([UPLOAD_DIR, OUTPUT_DIR] as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }
}

/**
 * Determine public base URL
 */
function get_base_url(): string {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    $protocol = $isHttps ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    $scriptDir = str_replace('\\', '/', $scriptDir);
    if ($scriptDir === '.' || $scriptDir === '/') {
        $scriptDir = '';
    } else {
        $scriptDir = preg_replace('/\/api$/', '', $scriptDir);
    }

    return rtrim($protocol . $host . $scriptDir, '/') . '/';
}

/**
 * Check if running locally
 */
function is_local_environment(): bool {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $hostName = explode(':', $host)[0];

    return $hostName === 'localhost' 
        || $hostName === '127.0.0.1' 
        || $hostName === '::1'
        || str_starts_with($hostName, '192.168.')
        || str_starts_with($hostName, '10.')
        || str_starts_with($hostName, '172.');
}

/**
 * Cleanup old files
 */
function cleanup_old_files(string $directory, int $maxAgeSeconds = TEMP_FILE_LIFETIME): void {
    if (!is_dir($directory)) {
        return;
    }

    $files = @scandir($directory);
    if (!$files) {
        return;
    }

    $now = time();
    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || $file === '.htaccess' || $file === 'index.html') {
            continue;
        }

        $filePath = $directory . $file;
        if (is_file($filePath)) {
            $fileAge = $now - @filemtime($filePath);
            if ($fileAge > $maxAgeSeconds) {
                @unlink($filePath);
            }
        }
    }
}
