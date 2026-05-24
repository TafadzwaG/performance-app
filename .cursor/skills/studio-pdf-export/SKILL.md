---
name: studio-pdf-export
description: >-
  Branded DomPDF export templates for Performance Appraisal Studio. Use when
  creating or editing PDF Blade views (access reports, appraisals, templates),
  DomPDF services, or export styling. Default orientation is landscape.
---

# Studio PDF Export Style

All branded PDF exports share one visual system. Match the IT User Access List report and appraisal assessment form.

## When to use

- Adding a new PDF export (report, form, template preview)
- Editing `resources/views/pdf/**`
- Configuring DomPDF in export services
- Aligning Excel export headers with PDF branding

## Technical defaults

Use `App\Support\Pdf\StudioExportPdf` for every Studio export:

```php
use App\Support\Pdf\StudioExportPdf;
use Barryvdh\DomPDF\Facade\Pdf;

StudioExportPdf::configure(
    Pdf::loadView('pdf.example.report', $context)
)->save($path);
```

| Setting | Value |
|---------|-------|
| Paper | A4 |
| Orientation | **Landscape** (default for all Studio exports) |
| Font | DejaVu Sans |
| Remote assets | enabled (logo data URIs) |

## Blade structure

1. Extend the shared layout: `@extends('pdf.layouts.studio-export')`
2. Set branding via `Branding::exportHeaderContext()` in the service and pass flattened keys to the view
3. Put report body in `@section('content')`

Shared files:

| File | Purpose |
|------|---------|
| `resources/views/pdf/layouts/studio-export.blade.php` | HTML shell, styles, header, footer |
| `resources/views/pdf/partials/studio-export-styles.blade.php` | CSS tokens |
| `resources/views/pdf/partials/studio-export-header.blade.php` | Logo, company, export meta |
| `resources/views/pdf/partials/studio-export-footer.blade.php` | Fixed footer |

Reference implementations:

| Template | Purpose |
|----------|---------|
| `resources/views/pdf/access/user-access-list.blade.php` | IT user access report |
| `resources/views/pdf/performance/appraisal-assessment-form.blade.php` | Individual performance assessment form |
| `resources/views/pdf/performance/template-export.blade.php` | Appraisal template export / preview |
| `resources/views/pdf/documentation/document.blade.php` | Help documentation PDFs |
| `resources/views/pdf/performance/appraisal-export.blade.php` | Full appraisal export pack |
| `resources/views/pdf/performance/report-table.blade.php` | Performance analytics reports (cycle, department, employee, etc.) |

All PDF-generating services must use `StudioExportPdf::configure()`:

- `App\Services\Access\Export\UserExportService`
- `App\Services\Performance\Export\AppraisalExportService`
- `App\Services\Performance\Pdf\AppraisalPdfService`
- `App\Services\Performance\Export\AppraisalTemplateExportService`
- `App\Services\Performance\Export\ReportExportService`
- `App\Http\Controllers\Access\HelpController` (documentation downloads)

## Branding context

Always spread `Branding::exportHeaderContext()` into the view data:

```php
$context = [
    ...Branding::exportHeaderContext(),
    'exportedBy' => $actor->name,
    'exportedByEmail' => $actor->email,
    'exportedAt' => now(),
    'headerReportLabel' => 'Report Title For Header',
    // report-specific keys...
];
```

Keys from branding: `companyName`, `companyAddress`, `logoDataUri`, `logoExists`, `reportFooter`.

## Visual tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Ink | `#252627` | Body text, table header background |
| Muted | `#5F5A4A` | Secondary text, addresses |
| Accent | `#8A8268` | Eyebrows, footer, export labels |
| Border | `#BFB48F` | Table borders, header rule |
| Section fill | `#F3EEDD` | § section headings, label cells |
| Grid border | `#D9D2BC` | Summary tiles, footer rule |
| Table header text | `#FFFFFF` | On `#252627` backgrounds |

## Typography

- Body: 9px DejaVu Sans, line-height 1.35
- Section headings (`h2`): 10px uppercase, letter-spacing 0.16em, `§` prefix, background `#F3EEDD`
- Eyebrow: 8px uppercase `#8A8268`
- Title block title: 18px normal weight
- Table headers: 8px uppercase white on `#252627`

## Layout components

Use these CSS classes from `studio-export-styles`:

- `.title-block` — report title + meta line under header
- `.section` + `h2` — grouped content with § heading
- `.data-table` — primary data grids (objectives, user rows, rating scales)
- `.kv-table` — label/value pairs (employee details, sign-off)
- `.filters table` — filter summary rows
- `.summary-grid` — numeric summary tiles
- `.comment-box` — free-text blocks with border
- `.footer` — fixed bottom footer (included by layout)

## Header variables

Pass to the layout (via view data):

- `headerReportLabel` — uppercase label in header meta (e.g. `Individual Performance Assessment Form`)
- `exportedBy`, `exportedByEmail`, `exportedAt` — optional export audit trail

## Checklist for new PDFs

- [ ] Extends `pdf.layouts.studio-export`
- [ ] Service uses `StudioExportPdf::configure()`
- [ ] Landscape A4 (do not set portrait unless explicitly required)
- [ ] DejaVu Sans only (no Arial/Times)
- [ ] § prefix on section headings
- [ ] Tables use `.data-table` or `.kv-table`
- [ ] Branding from `Branding::exportHeaderContext()`
- [ ] Feature test covers download + key view strings
