<?php
/**
 * ClearCut - Configuration
 *
 * Central configuration file for ClearCut background removal application.
 * All application constants, API keys, and environment settings are defined here.
 */

// Application Information
define('APP_NAME', 'ClearCut');
define('APP_TAGLINE', 'AI-Powered Image Background Removal');
define('APP_VERSION', '1.0.0');

/**
 * Pixelcut API Key Configuration
 *
 * IMPORTANT SECURITY NOTE:
 * Never commit your real API key to public repositories like GitHub!
 * You can set the PIXELCUT_API_KEY environment variable on your server,
 * or replace the placeholder below with your personal API key.
 *
 * Example:
 * define('PIXELCUT_API_KEY', 'sk_live_...');
 */
$envApiKey = getenv('PIXELCUT_API_KEY');
define('PIXELCUT_API_KEY', !empty($envApiKey) ? $envApiKey : 'sk_e0970a0391c34c94814a4047b3015350');

// Pixelcut API Endpoint
define('PIXELCUT_API_ENDPOINT', 'https://api.developer.pixelcut.ai/v1/remove-background');

// File Upload Constraints
define('MAX_FILE_SIZE', 15 * 1024 * 1024); // 15 Megabytes in bytes
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

// Garbage Collection Settings (hours before temp files expire)
define('TEMP_FILE_LIFETIME', 3600); // 1 hour in seconds

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
 * Determine the public base URL of the application
 *
 * @return string Current base URL (e.g., https://example.com/clearcut/)
 */
function get_base_url(): string {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)
        || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    $protocol = $isHttps ? 'https://' : 'http://';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    // Get directory path of script
    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    $scriptDir = str_replace('\\', '/', $scriptDir);
    if ($scriptDir === '.' || $scriptDir === '/') {
        $scriptDir = '';
    } else {
        // If we are currently inside api/, strip it for base url
        $scriptDir = preg_replace('/\/api$/', '', $scriptDir);
    }

    return rtrim($protocol . $host . $scriptDir, '/') . '/';
}

/**
 * Check whether the current server is running on localhost or a private IP
 *
 * @return bool True if local development environment
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
 * Lightweight garbage collection for old temporary files
 *
 * @param string $directory Target directory
 * @param int $maxAgeSeconds Maximum age in seconds
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

/**
 * Configure SSL certificate validation on cURL handles
 * Resolves Windows/XAMPP curl.cainfo missing certificate error (Errno 60)
 *
 * @param \CurlHandle|resource $ch
 */
function configure_curl_ssl($ch): void {
    $bundledCa = __DIR__ . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'cacert.pem';
    $systemCa = ini_get('curl.cainfo');

    if (!empty($systemCa) && file_exists($systemCa)) {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    } elseif (file_exists($bundledCa)) {
        curl_setopt($ch, CURLOPT_CAINFO, $bundledCa);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    } elseif (is_local_environment()) {
        // Fallback for local development environments lacking CA bundle
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    } else {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    }
}
