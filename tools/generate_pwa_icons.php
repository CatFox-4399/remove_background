<?php
/**
 * Script to render PWA PNG icons using GD
 */
$iconDir = dirname(__DIR__) . '/assets/icons';
if (!is_dir($iconDir)) {
    mkdir($iconDir, 0755, true);
}

function createPwaIcon($size, $isMaskable, $outputPath) {
    $img = imagecreatetruecolor($size, $size);
    imagesavealpha($img, true);
    $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
    imagefill($img, 0, 0, $transparent);

    // Color definitions
    $colBgDark = imagecolorallocate($img, 11, 15, 25);
    $colBlade = imagecolorallocate($img, 56, 189, 248);
    $colWhite = imagecolorallocate($img, 255, 255, 255);
    $colAccent = imagecolorallocate($img, 2, 132, 199);
    $colBorder = imagecolorallocatealpha($img, 56, 189, 248, 60);

    // Draw background
    if ($isMaskable) {
        // Maskable icons require full bleed background
        imagefilledrectangle($img, 0, 0, $size, $size, $colBgDark);
        // Corner gradient accent
        imagefilledrectangle($img, (int)($size * 0.6), (int)($size * 0.6), $size, $size, $colAccent);
    } else {
        // Standard icon: Rounded rectangle squircle
        $radius = (int)($size * 0.22);
        // Fill full with dark background
        imagefilledrectangle($img, 0, 0, $size, $size, $colBgDark);
        // Diagonal gradient corner accent
        for ($i = 0; $i < (int)($size * 0.4); $i++) {
            $alpha = (int)(110 - ($i / ($size * 0.4)) * 90);
            $blendCol = imagecolorallocatealpha($img, 2, 132, 199, max(0, min(127, $alpha)));
            imagefilledrectangle($img, $size - $i, $size - $i, $size, $size, $blendCol);
        }
        // Border ring
        imagesetthickness($img, max(2, (int)($size * 0.015)));
        imagerectangle($img, 2, 2, $size - 3, $size - 3, $colBorder);
    }

    // Draw stylized scissors icon centered
    $cx = $size / 2;
    $cy = $size / 2;
    $scale = $size * ($isMaskable ? 0.024 : 0.030);
    imagesetthickness($img, max(3, (int)($size * 0.038)));

    // Top Handle Circle (cx: 6, cy: 6 in 24x24)
    $hTopX = (int)($cx + (6 - 12) * $scale);
    $hTopY = (int)($cy + (6 - 12) * $scale);
    $hRadius = (int)(3 * $scale);
    imageellipse($img, $hTopX, $hTopY, $hRadius * 2, $hRadius * 2, $colBlade);

    // Bottom Handle Circle (cx: 6, cy: 18 in 24x24)
    $hBotX = (int)($cx + (6 - 12) * $scale);
    $hBotY = (int)($cy + (18 - 12) * $scale);
    imageellipse($img, $hBotX, $hBotY, $hRadius * 2, $hRadius * 2, $colBlade);

    // Long Blade (20,4 to 8.12, 15.88)
    $b1x1 = (int)($cx + (20 - 12) * $scale);
    $b1y1 = (int)($cy + (4 - 12) * $scale);
    $b1x2 = (int)($cx + (8.12 - 12) * $scale);
    $b1y2 = (int)($cy + (15.88 - 12) * $scale);
    imageline($img, $b1x1, $b1y1, $b1x2, $b1y2, $colWhite);

    // Short Blade (14.47, 14.48 to 20, 20)
    $b2x1 = (int)($cx + (14.47 - 12) * $scale);
    $b2y1 = (int)($cy + (14.48 - 12) * $scale);
    $b2x2 = (int)($cx + (20 - 12) * $scale);
    $b2y2 = (int)($cy + (20 - 12) * $scale);
    imageline($img, $b2x1, $b2y1, $b2x2, $b2y2, $colWhite);

    // Pivot Line (8.12, 8.12 to 12, 12)
    $b3x1 = (int)($cx + (8.12 - 12) * $scale);
    $b3y1 = (int)($cy + (8.12 - 12) * $scale);
    $b3x2 = (int)($cx + (12 - 12) * $scale);
    $b3y2 = (int)($cy + (12 - 12) * $scale);
    imageline($img, $b3x1, $b3y1, $b3x2, $b3y2, $colWhite);

    // Center Pivot Pin
    $pinR = max(3, (int)($size * 0.022));
    imagefilledellipse($img, (int)$cx, (int)$cy, $pinR * 2, $pinR * 2, $colBlade);

    // Sparkle (diamond) top right
    $spX = (int)($cx + 5.5 * $scale);
    $spY = (int)($cy - 5.5 * $scale);
    $spR = max(3, (int)($size * 0.035));
    $sparklePoints = [
        $spX, $spY - $spR,
        $spX + (int)($spR * 0.6), $spY,
        $spX, $spY + $spR,
        $spX - (int)($spR * 0.6), $spY
    ];
    imagefilledpolygon($img, $sparklePoints, $colBlade);

    imagepng($img, $outputPath);
    imagedestroy($img);
    echo "Generated: " . basename($outputPath) . " ({$size}x{$size})\n";
}

createPwaIcon(192, false, $iconDir . '/icon-192.png');
createPwaIcon(512, false, $iconDir . '/icon-512.png');
createPwaIcon(192, true, $iconDir . '/icon-maskable-192.png');
createPwaIcon(512, true, $iconDir . '/icon-maskable-512.png');
createPwaIcon(180, false, $iconDir . '/apple-touch-icon.png');
