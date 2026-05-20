<?php

/**
 * Generates raster favicon assets from the brand mark:
 *   - public/favicon.ico         (16, 32, 48 px multi-size)
 *   - public/favicon-32.png      (modern Link rel="icon")
 *   - public/favicon-180.png     (apple-touch-icon)
 *
 * Run with: php scripts/generate-favicon.php
 *
 * Uses GD only — no third-party deps.
 */

require __DIR__.'/../vendor/autoload.php';

if (! extension_loaded('gd')) {
    fwrite(STDERR, "GD extension is required.\n");
    exit(1);
}

$publicDir = __DIR__.'/../public';

/**
 * Render the brand mark onto a square truecolor canvas at the given size.
 */
function renderFaviconMark(int $size): GdImage
{
    $img = imagecreatetruecolor($size, $size);
    imagesavealpha($img, true);
    imagealphablending($img, true);

    // Transparent base
    $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
    imagefilledrectangle($img, 0, 0, $size, $size, $transparent);

    // Brand palette
    $ink = imagecolorallocate($img, 0x25, 0x26, 0x27);
    $sand = imagecolorallocate($img, 0xBF, 0xB4, 0x8F);
    $pine = imagecolorallocate($img, 0x2F, 0x4A, 0x3F);

    $rounded = function (int $x1, int $y1, int $x2, int $y2, int $r, int $color) use ($img) {
        // Solid centre
        imagefilledrectangle($img, $x1 + $r, $y1, $x2 - $r, $y2, $color);
        imagefilledrectangle($img, $x1, $y1 + $r, $x2, $y2 - $r, $color);
        // Corner discs
        imagefilledellipse($img, $x1 + $r, $y1 + $r, $r * 2, $r * 2, $color);
        imagefilledellipse($img, $x2 - $r, $y1 + $r, $r * 2, $r * 2, $color);
        imagefilledellipse($img, $x1 + $r, $y2 - $r, $r * 2, $r * 2, $color);
        imagefilledellipse($img, $x2 - $r, $y2 - $r, $r * 2, $r * 2, $color);
    };

    // Outer ink plate (~3% inset, ~16% corner radius)
    $pad = max(1, (int) round($size * 0.03));
    $rOuter = max(2, (int) round($size * 0.16));
    $rounded($pad, $pad, $size - $pad - 1, $size - $pad - 1, $rOuter, $ink);

    // Sand inset (~12% inset from canvas, ~10% radius)
    $innerPad = max(2, (int) round($size * 0.12));
    $rInner = max(2, (int) round($size * 0.10));
    $rounded($innerPad, $innerPad, $size - $innerPad - 1, $size - $innerPad - 1, $rInner, $sand);

    // P glyph — drawn with primitives so it looks crisp at small sizes
    $s = $size;
    $stemLeft = (int) round($s * 0.34);
    $stemRight = (int) round($s * 0.44);
    $stemTop = (int) round($s * 0.24);
    $stemBottom = (int) round($s * 0.76);

    imagefilledrectangle($img, $stemLeft, $stemTop, $stemRight, $stemBottom, $ink);

    // Bowl of the P — filled ring
    $bowlCx = (int) round($s * 0.52);
    $bowlCy = (int) round($s * 0.38);
    $bowlOuter = (int) round($s * 0.34);
    $bowlInner = (int) round($s * 0.18);
    imagefilledellipse($img, $bowlCx, $bowlCy, $bowlOuter, $bowlOuter, $ink);
    imagefilledellipse($img, $bowlCx, $bowlCy, $bowlInner, $bowlInner, $sand);

    // Pine accent dot (lower-right)
    if ($size >= 24) {
        $dotR = max(2, (int) round($size * 0.06));
        $dotCx = $size - $innerPad - $dotR;
        $dotCy = $size - $innerPad - $dotR;
        imagefilledellipse($img, $dotCx, $dotCy, $dotR * 2, $dotR * 2, $pine);
    }

    return $img;
}

/**
 * Encode a GD image as a PNG into a binary string.
 */
function imageToPngBinary(GdImage $img): string
{
    ob_start();
    imagepng($img, null, 9, PNG_NO_FILTER);

    return (string) ob_get_clean();
}

/**
 * Build a Vista-style PNG-encoded ICO with multiple sizes.
 *
 * @param  array<int,string>  $pngsBySize
 */
function buildIco(array $pngsBySize): string
{
    ksort($pngsBySize);
    $count = count($pngsBySize);

    // ICONDIR
    $out = pack('vvv', 0, 1, $count);

    $offset = 6 + 16 * $count;
    $entries = '';
    $images = '';

    foreach ($pngsBySize as $size => $png) {
        $byteSize = strlen($png);
        $width = $size >= 256 ? 0 : $size;
        $height = $size >= 256 ? 0 : $size;

        // ICONDIRENTRY: width, height, colors, reserved, planes, bpp, size, offset
        $entries .= pack(
            'CCCCvvVV',
            $width,
            $height,
            0,    // colors (0 = >=256)
            0,    // reserved
            1,    // planes
            32,   // bits per pixel
            $byteSize,
            $offset,
        );

        $images .= $png;
        $offset += $byteSize;
    }

    return $out.$entries.$images;
}

$sizes = [16, 32, 48];
$pngs = [];
foreach ($sizes as $size) {
    $img = renderFaviconMark($size);
    $pngs[$size] = imageToPngBinary($img);
    imagedestroy($img);
}

file_put_contents($publicDir.'/favicon.ico', buildIco($pngs));

// Standalone PNG (for <link rel="icon" sizes="32x32" ...>)
$png32 = renderFaviconMark(32);
imagepng($png32, $publicDir.'/favicon-32.png', 9);
imagedestroy($png32);

// Apple touch icon (180x180)
$apple = renderFaviconMark(180);
imagepng($apple, $publicDir.'/apple-touch-icon.png', 9);
imagedestroy($apple);

echo "Wrote:\n";
echo '  public/favicon.ico  ('.filesize($publicDir.'/favicon.ico')." bytes)\n";
echo '  public/favicon-32.png  ('.filesize($publicDir.'/favicon-32.png')." bytes)\n";
echo '  public/apple-touch-icon.png  ('.filesize($publicDir.'/apple-touch-icon.png')." bytes)\n";
