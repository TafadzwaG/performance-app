<?php

namespace App\Support\Pdf;

use Barryvdh\DomPDF\PDF;

/**
 * Shared DomPDF defaults for branded Studio exports (access reports, appraisals, templates).
 */
class StudioExportPdf
{
    public const PAPER = 'a4';

    public const ORIENTATION = 'landscape';

    public const DEFAULT_FONT = 'DejaVu Sans';

    /**
     * @return array<string, bool|string>
     */
    public static function options(): array
    {
        return [
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => self::DEFAULT_FONT,
        ];
    }

    public static function configure(PDF $pdf): PDF
    {
        return $pdf
            ->setPaper(self::PAPER, self::ORIENTATION)
            ->setOptions(self::options());
    }
}
