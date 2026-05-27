<?php

namespace App\Support\Performance;

class PerformanceTrendChartSvg
{
    /**
     * @param  array<int, array{cycle_name: string, score: float|int|string}>  $points
     */
    public static function render(array $points): string
    {
        if ($points === []) {
            return '';
        }

        $width = 700;
        $height = 200;
        $paddingLeft = 36;
        $paddingRight = 16;
        $paddingTop = 16;
        $paddingBottom = 48;
        $plotWidth = $width - $paddingLeft - $paddingRight;
        $plotHeight = $height - $paddingTop - $paddingBottom;
        $count = count($points);
        $slotWidth = $plotWidth / max($count, 1);
        $barWidth = min(48, $slotWidth * 0.55);

        $elements = [];

        for ($tick = 0; $tick <= 100; $tick += 25) {
            $y = $paddingTop + $plotHeight - ($tick / 100 * $plotHeight);
            $elements[] = sprintf(
                '<line x1="%d" y1="%.1f" x2="%d" y2="%.1f" stroke="#E5DFCF" stroke-width="1"/>',
                $paddingLeft,
                $y,
                $paddingLeft + $plotWidth,
                $y,
            );
            $elements[] = sprintf(
                '<text x="%d" y="%.1f" font-size="8" fill="#5F5A4A" text-anchor="end">%d%%</text>',
                $paddingLeft - 6,
                $y + 3,
                $tick,
            );
        }

        $linePoints = [];

        foreach ($points as $index => $point) {
            $score = max(0, min(100, (float) $point['score']));
            $centerX = $paddingLeft + ($index + 0.5) * $slotWidth;
            $barHeight = ($score / 100) * $plotHeight;
            $barX = $centerX - ($barWidth / 2);
            $barY = $paddingTop + $plotHeight - $barHeight;

            $elements[] = sprintf(
                '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="3" fill="#BFB48F"/>',
                $barX,
                $barY,
                $barWidth,
                $barHeight,
            );
            $elements[] = sprintf(
                '<text x="%.1f" y="%.1f" font-size="9" fill="#252627" text-anchor="middle" font-weight="bold">%s</text>',
                $centerX,
                max($paddingTop + 10, $barY - 4),
                htmlspecialchars(ScoreFormatter::formatPercent($score), ENT_QUOTES | ENT_XML1),
            );

            $cycleName = self::truncateLabel((string) $point['cycle_name'], 22);
            $elements[] = sprintf(
                '<text x="%.1f" y="%d" font-size="7.5" fill="#5F5A4A" text-anchor="middle">%s</text>',
                $centerX,
                $height - 8,
                htmlspecialchars($cycleName, ENT_QUOTES | ENT_XML1),
            );

            $linePoints[] = sprintf('%.1f,%.1f', $centerX, $barY);
        }

        if (count($linePoints) >= 2) {
            $elements[] = sprintf(
                '<polyline points="%s" fill="none" stroke="#252627" stroke-width="1.5"/>',
                implode(' ', $linePoints),
            );

            foreach ($linePoints as $point) {
                [$x, $y] = explode(',', $point);
                $elements[] = sprintf(
                    '<circle cx="%s" cy="%s" r="3.5" fill="#252627"/>',
                    $x,
                    $y,
                );
            }
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="100%%" height="%d">%s</svg>',
            $width,
            $height,
            $height,
            implode('', $elements),
        );
    }

    private static function truncateLabel(string $label, int $max): string
    {
        if (strlen($label) <= $max) {
            return $label;
        }

        return substr($label, 0, $max - 1).'…';
    }
}
