---
name: studio-pdf-exports
description: Build branded Laravel DomPDF exports that match the Performance Appraisal Studio PDF style, including reusable Blade layout, header/footer branding, A4 landscape setup, exact font sizes, table structures, summary blocks, and report/appraisal PDF generation patterns. Use when another Laravel project needs professional PDF exports with the same structure, typography, spacing, and branded report format.
---

# Studio PDF Exports

Use this skill when building reusable, branded PDF exports in a Laravel project. Match the Performance Appraisal Studio export style: A4 landscape, compact DejaVu Sans typography, fixed header/footer, muted gold section bands, dark table headers, summary grids, and report-specific Blade views extending one shared layout.

## Core Architecture

Create one shared PDF configurator, one shared Blade layout, three shared partials, and one content view per export.

```text
app/Support/Pdf/StudioExportPdf.php
app/Support/Branding.php
resources/views/pdf/layouts/studio-export.blade.php
resources/views/pdf/partials/studio-export-styles.blade.php
resources/views/pdf/partials/studio-export-header.blade.php
resources/views/pdf/partials/studio-export-footer.blade.php
resources/views/pdf/<domain>/<report>.blade.php
```

Generate PDFs through `barryvdh/laravel-dompdf`:

```php
StudioExportPdf::configure(
    Pdf::loadView('pdf.performance.report-table', $context)
)->save($tempPath);
```

Return downloads with:

```php
return response()->download($tempPath, $fileName, [
    'Content-Type' => 'application/pdf',
])->deleteFileAfterSend(true);
```

## DomPDF Defaults

Create `app/Support/Pdf/StudioExportPdf.php`.

```php
<?php

namespace App\Support\Pdf;

use Barryvdh\DomPDF\PDF;

class StudioExportPdf
{
    public const PAPER = 'a4';
    public const ORIENTATION = 'landscape';
    public const DEFAULT_FONT = 'DejaVu Sans';

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
```

Use `DejaVu Sans` because DomPDF ships with it and it handles broad Unicode safely.

## Shared Layout

Create `resources/views/pdf/layouts/studio-export.blade.php`.

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Export')</title>
    @include('pdf.partials.studio-export-styles')
    @stack('styles')
</head>
<body>
    @include('pdf.partials.studio-export-header')
    @yield('content')
    @include('pdf.partials.studio-export-footer')
</body>
</html>
```

Every report view must set `$headerReportLabel` before extending the layout:

```blade
@php
    $headerReportLabel = $reportTitle ?? 'Export';
@endphp
@extends('pdf.layouts.studio-export')
```

## Exact Style System

Create `resources/views/pdf/partials/studio-export-styles.blade.php`.

```blade
<style>
    @page { margin: 24px 28px 72px 28px; }

    body {
        font-family: DejaVu Sans, sans-serif;
        color: #252627;
        font-size: 9px;
        line-height: 1.35;
    }

    h1, h2, h3 { margin: 0; }

    .header {
        border-bottom: 2px solid #BFB48F;
        padding-bottom: 10px;
        margin-bottom: 12px;
    }

    .header table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .header td { vertical-align: top; }
    .header .logo { width: 16%; }
    .header .logo img { max-width: 92px; max-height: 52px; }
    .header .company-cell { width: 52%; padding: 0 12px 0 6px; }
    .header .company { font-size: 14px; font-weight: bold; line-height: 1.25; }
    .header .address { color: #5F5A4A; font-size: 8.5px; margin-top: 2px; }
    .header .meta-cell { width: 32%; text-align: right; }
    .header .export-label {
        font-size: 8px;
        color: #8A8268;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
    }
    .header .export-by { color: #5F5A4A; font-size: 8.5px; }

    .eyebrow {
        font-size: 8px;
        color: #8A8268;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 3px;
    }

    .title-block { margin-bottom: 10px; }
    .title-block .title { font-size: 18px; font-weight: normal; }
    .title-block .meta { color: #5F5A4A; font-size: 9px; margin-top: 2px; }

    .section { margin-bottom: 10px; page-break-inside: avoid; }
    .section h2 {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #252627;
        background: #F3EEDD;
        padding: 5px 7px;
        margin-bottom: 6px;
    }

    .filters table,
    .summary table,
    .kv-table {
        width: 100%;
        border-collapse: collapse;
    }

    .filters td,
    .summary td,
    .kv-table td {
        padding: 3px 6px;
        border: 1px solid #BFB48F;
        vertical-align: top;
    }

    .filters td.label,
    .summary td.label,
    .kv-table td.label {
        width: 14%;
        font-weight: bold;
        background: #F3EEDD;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .summary-grid {
        width: 100%;
        border-collapse: collapse;
    }

    .summary-grid td {
        width: 25%;
        border: 1px solid #D9D2BC;
        padding: 8px;
        text-align: center;
        vertical-align: top;
    }

    .summary-grid .value {
        font-size: 16px;
        font-weight: bold;
        color: #252627;
        line-height: 1.1;
    }

    .summary-grid .label {
        font-size: 8px;
        color: #8A8268;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-top: 4px;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .data-table th,
    .data-table td {
        border: 1px solid #BFB48F;
        padding: 4px 5px;
        vertical-align: top;
        word-wrap: break-word;
    }

    .data-table th {
        background: #252627;
        color: #FFFFFF;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: bold;
        text-align: left;
    }

    .muted { color: #5F5A4A; }

    .pill {
        display: inline-block;
        padding: 2px 6px;
        border: 1px solid #BFB48F;
        background: #F3EEDD;
        color: #252627;
        font-size: 8px;
        font-weight: bold;
        letter-spacing: 0.04em;
    }

    .stat-band {
        width: 100%;
        border-collapse: collapse;
        background: #252627;
        color: #ffffff;
    }

    .stat-band td {
        text-align: center;
        padding: 8px 10px;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
        vertical-align: middle;
    }

    .stat-band tr td:last-child { border-right: 0; }

    .stat-band .num {
        font-size: 16px;
        color: #BFB48F;
        font-weight: bold;
        line-height: 1.1;
    }

    .stat-band .lbl {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 4px;
    }

    .comment-box {
        border: 1px solid #BFB48F;
        padding: 5px 7px;
        min-height: 24px;
    }

    .summary-panel {
        border: 1px solid #BFB48F;
        background: #F3EEDD;
        padding: 6px 8px;
        margin-bottom: 10px;
    }

    .footer {
        position: fixed;
        left: 28px;
        right: 28px;
        bottom: 18px;
        border-top: 1px solid #D9D2BC;
        padding-top: 6px;
        font-size: 8px;
        color: #8A8268;
    }

    .footer-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .footer-table td { vertical-align: middle; }
    .footer-table .footer-main { width: 70%; line-height: 1.35; padding-right: 10px; }
    .footer-table .footer-powered { width: 30%; text-align: right; white-space: nowrap; }
    .powered-by .label {
        font-size: 7px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #8A8268;
        margin-right: 4px;
    }
    .powered-by img { height: 16px; vertical-align: middle; }
</style>
```

Keep body copy at `9px`, table headers at `8px`, section headings at `10px`, title text at `18px`, and stat values at `16px`.

## Header And Footer Data

Pass these keys into every PDF view context:

```php
[
    'logoPath' => $logoPath,
    'logoUrl' => $logoUrl,
    'logoDataUri' => $logoDataUri,
    'logoPdfSrc' => $logoPdfSrc,
    'logoExists' => true,
    'poweredByPath' => $poweredByPath,
    'poweredByUrl' => $poweredByUrl,
    'poweredByDataUri' => $poweredByDataUri,
    'poweredByPdfSrc' => $poweredByPdfSrc,
    'poweredByExists' => true,
    'companyName' => 'Company Name',
    'companyAddress' => 'Address lines',
    'reportFooter' => 'Confidential report footer text',
    'exportedBy' => $user->name,
    'exportedByEmail' => $user->email,
    'exportedAt' => now(),
]
```

Use data URIs for images first. DomPDF is more reliable with embedded base64 image sources than browser URLs.

Create a helper like:

```php
public static function imageDataUriForPath(?string $path): ?string
{
    if ($path === null || ! file_exists($path)) {
        return null;
    }

    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $mime = match ($extension) {
        'jpg', 'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        default => 'image/png',
    };

    return 'data:'.$mime.';base64,'.base64_encode((string) file_get_contents($path));
}
```

## Report View Pattern

Use this structure for tabular reports:

```blade
@php
    $headerReportLabel = $reportTitle;
@endphp
@extends('pdf.layouts.studio-export')

@section('title', $reportTitle)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Performance Report</div>
        <div class="title">{{ $reportTitle }}</div>
        <div class="meta">
            {{ $reportDescription }}
            {{ $totalRows }} record{{ $totalRows === 1 ? '' : 's' }} exported.
        </div>
    </div>

    <div class="section filters">
        <h2>Export Filters</h2>
        <table>
            @foreach ($filterRows as [$label, $value])
                <tr>
                    <td class="label">{{ $label }}</td>
                    <td>{{ $value }}</td>
                </tr>
            @endforeach
        </table>
    </div>

    <div class="section summary">
        <h2>Summary</h2>
        <table class="summary-grid">
            <tr>
                <td><div class="value">{{ $totalRows }}</div><div class="label">Total Records</div></td>
                <td><div class="value">{{ count($headings) }}</div><div class="label">Columns</div></td>
                <td><div class="value">{{ $filterRows[0][1] ?? 'All cycles' }}</div><div class="label">Review Cycle</div></td>
                <td><div class="value">{{ $exportedAt->format('d M Y') }}</div><div class="label">Export Date</div></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>{{ $reportTitle }}</h2>
        <table class="data-table">
            <thead>
                <tr>
                    @foreach ($headings as $heading)
                        <th>{{ $heading }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($tableRows as $row)
                    <tr>
                        @foreach ($row as $value)
                            <td>{{ $value }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endsection
```

## Appraisal / Detail View Pattern

Use this order for detail-heavy PDFs:

1. Title block with employee/report name, status pill, cycle/template metadata.
2. Two-column `kv-table` section for identity and workflow fields.
3. `stat-band` for key scores or totals.
4. Repeating `data-table` sections for objectives, values, comments, approvals, and actions.
5. Use `Str::limit()` for long table cells to protect layout.
6. Use `page-break-inside: avoid` on `.section`, but expect long tables to split naturally.

Example score band:

```blade
<div class="section">
    <h2>Score Summary</h2>
    <table class="stat-band">
        <tr>
            <td><div class="num">{{ number_format((float) $businessScore, 1) }}</div><div class="lbl">Business</div></td>
            <td><div class="num">{{ number_format((float) $valuesScore, 1) }}</div><div class="lbl">Values</div></td>
            <td><div class="num">{{ number_format((float) $overallScore, 1) }}</div><div class="lbl">Overall</div></td>
            <td><div class="num" style="font-size:12px;">{{ $ratingLabel }}</div><div class="lbl">Final Rating</div></td>
        </tr>
    </table>
</div>
```

## Implementation Checklist

When applying this skill in another Laravel project:

1. Install and configure `barryvdh/laravel-dompdf`.
2. Add `StudioExportPdf`.
3. Add the shared PDF layout and partials.
4. Add or adapt `Branding::exportHeaderContext()` so every PDF receives logo, company, footer, exporter, and timestamp values.
5. Build one Blade content view per export.
6. Build a service method that prepares data, loads needed relations, renders the PDF, saves to `storage/app/exports`, and returns a download response.
7. Verify the generated PDF visually, not only with HTTP status.
8. Keep PDF HTML table-based. Avoid flexbox, CSS grid, external fonts, and complex browser-only CSS because DomPDF support is limited.

## Verification Commands

Run the route or service test that downloads the PDF:

```bash
php artisan test tests/Feature/<Area>/<PdfExportTest>.php
```

For manual verification, trigger the export route and inspect:

- header logo and company text
- page margins and footer position
- title block hierarchy
- section band spacing
- table header contrast
- text wrapping in long cells
- no clipped footer content
- correct A4 landscape orientation
