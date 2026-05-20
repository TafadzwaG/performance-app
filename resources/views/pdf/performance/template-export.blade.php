<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Template — {{ $template->name }}</title>
    <style>
        @page { margin: 28px 32px 80px 32px; }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #252627;
            font-size: 10px;
            line-height: 1.4;
            padding-bottom: 48px;
        }

        h1, h2, h3 { margin: 0; }

        .header {
            border-bottom: 2px solid #BFB48F;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .header table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .header td { vertical-align: top; }
        .header .logo { width: 18%; }
        .header .logo img { max-width: 100px; max-height: 56px; }
        .header .company-cell {
            width: 50%;
            padding: 0 16px 0 8px;
        }
        .header .company {
            font-size: 15px;
            font-weight: bold;
            color: #252627;
            line-height: 1.3;
            word-wrap: break-word;
        }
        .header .address { color: #5F5A4A; font-size: 9px; margin-top: 2px; }
        .header .meta-cell {
            width: 32%;
            text-align: right;
        }
        .header .export-label {
            font-size: 9px;
            color: #8A8268;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 4px;
            line-height: 1.2;
        }
        .header .export-by {
            font-size: 9px;
            color: #5F5A4A;
            line-height: 1.35;
        }

        .eyebrow {
            font-size: 8.5px;
            color: #8A8268;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
            line-height: 1.3;
        }

        .title-block { margin: 2px 0 8px; }
        .title-block .title {
            font-size: 20px; font-weight: normal; color: #252627; letter-spacing: -0.02em;
        }
        .title-block .meta { color: #5F5A4A; font-size: 10px; }

        .section { margin-bottom: 12px; page-break-inside: avoid; }
        .section h2 {
            font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.18em;
            color: #2F4A3F; border-bottom: 1px solid #EFE9D8;
            padding-bottom: 4px; margin-bottom: 6px;
        }

        .info-grid { width: 100%; border-collapse: collapse; }
        .info-grid td { padding: 4px 8px 4px 0; vertical-align: top; }
        .info-grid .label {
            color: #8A8268; font-size: 8.5px; text-transform: uppercase;
            letter-spacing: 0.18em; font-weight: bold; width: 140px;
        }
        .info-grid .value { color: #252627; font-size: 10.5px; }

        .pill {
            display: inline-block; padding: 2px 8px; border: 1px solid #BFB48F;
            background: #F3EEDD; color: #252627; border-radius: 999px;
            font-size: 9.5px; font-weight: bold; letter-spacing: 0.04em;
        }

        .pill-rust {
            display: inline-block; padding: 2px 8px; border: 1px solid #B8593B;
            background: rgba(184, 89, 59, 0.08); color: #B8593B; border-radius: 999px;
            font-size: 9.5px; font-weight: bold;
        }

        .data-table { width: 100%; border-collapse: collapse; border: 1px solid #BFB48F; }
        .data-table thead th {
            background: #252627; color: #ffffff; font-size: 9px;
            text-transform: uppercase; letter-spacing: 0.16em; text-align: left;
            padding: 5px 7px; border: 1px solid #252627;
        }
        .data-table tbody td {
            border: 1px solid #E4DDC4; padding: 5px 7px; color: #252627;
            font-size: 9.5px; vertical-align: top;
        }
        .data-table tbody tr:nth-child(even) td { background: #FBF9F0; }

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
        .stat-band .num { font-size: 20px; color: #BFB48F; font-weight: bold; line-height: 1.1; }
        .stat-band .lbl {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 2px;
            line-height: 1.2;
        }

        .footer {
            position: fixed;
            bottom: -62px;
            left: 0;
            right: 0;
            height: 48px;
            color: #8A8268;
            font-size: 8.5px;
            font-style: italic;
            border-top: 1px solid #EFE9D8;
            padding-top: 10px;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .footer-table td { vertical-align: middle; }
        .footer-table .generated-by {
            width: 70%;
            line-height: 1.35;
            padding-right: 12px;
        }
        .footer-table .right {
            width: 30%;
            text-align: right;
            white-space: nowrap;
            vertical-align: middle;
        }
        .powered-by {
            font-style: normal;
            color: #5F5A4A;
        }
        .powered-by .label {
            font-size: 7px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #8A8268;
            margin-right: 4px;
        }
        .powered-by img { height: 18px; vertical-align: middle; }

        .muted { color: #8A8268; }
        .strong { font-weight: bold; }
        .small { font-size: 9px; }
    </style>
</head>
<body>
    {{-- ====================================================== HEADER --}}
    <div class="header">
        <table>
            <tr>
                <td class="logo">
                    @if($logoExists)
                        <img src="{{ $logoPath }}" alt="">
                    @endif
                </td>
                <td class="company-cell">
                    <div class="company">{{ $companyName }}</div>
                    @if($companyAddress)
                        <div class="address">{{ $companyAddress }}</div>
                    @endif
                </td>
                <td class="meta-cell">
                    <div class="export-label">Exported</div>
                    <div class="export-by">
                        By <span class="strong">{{ $exportedBy }}</span><br>
                        {{ $exportedAt->format('d M Y · H:i') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ====================================================== TITLE --}}
    <div class="section">
        <div class="eyebrow">Appraisal Template</div>
        <div class="title-block">
            <div class="title">{{ $template->name }}</div>
            <div class="meta">
                <span class="pill">v{{ $template->version ?? 1 }}</span>
                @if($template->is_active)
                    <span class="pill">Active</span>
                @else
                    <span class="pill-rust">Inactive</span>
                @endif
                &nbsp;·&nbsp; {{ $template->code ?? '—' }}
                @if($template->description)
                    &nbsp;·&nbsp; {{ \Illuminate\Support\Str::limit($template->description, 120) }}
                @endif
            </div>
        </div>
    </div>

    {{-- ====================================================== STAT BAND --}}
    <div class="section">
        <table class="stat-band">
            <tr>
                <td>
                <div class="num">{{ $template->business_weight_percent ?? 0 }}%</div>
                <div class="lbl">Business</div>
                </td>
                <td>
                <div class="num">{{ $template->values_weight_percent ?? 0 }}%</div>
                <div class="lbl">Values</div>
                </td>
                <td>
                <div class="num">{{ $template->min_objectives ?? 0 }}–{{ $template->max_objectives ?? 0 }}</div>
                <div class="lbl">Goal Range</div>
                </td>
                <td>
                <div class="num">{{ $objectiveItems->count() }}</div>
                <div class="lbl">Objectives</div>
                </td>
                <td>
                <div class="num">{{ $valueItems->count() }}</div>
                <div class="lbl">Values</div>
                </td>
                <td>
                <div class="num">{{ number_format($totalWeight, 0) }}%</div>
                    <div class="lbl">Total Weight</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ====================================================== OVERVIEW --}}
    <div class="section">
        <h2>Overview &amp; Scope</h2>
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td style="width:50%; vertical-align:top; padding-right:14px;">
                    <table class="info-grid">
                        <tr><td class="label">Code</td><td class="value">{{ $template->code ?? '—' }}</td></tr>
                        <tr><td class="label">Version</td><td class="value">v{{ $template->version ?? 1 }}</td></tr>
                        <tr><td class="label">Description</td><td class="value">{{ \Illuminate\Support\Str::limit($template->description ?? '—', 220) }}</td></tr>
                        <tr><td class="label">Allow values</td><td class="value">{{ $template->allow_competencies ? 'Yes' : 'No' }}</td></tr>
                    </table>
                </td>
                <td style="width:50%; vertical-align:top;">
                    <table class="info-grid">
                        <tr><td class="label">Department</td><td class="value">{{ $template->department?->name ?? 'All departments' }}</td></tr>
                        <tr><td class="label">Job Title</td><td class="value">{{ $template->jobTitle?->name ?? 'All job titles' }}</td></tr>
                        <tr><td class="label">Objective Scale</td><td class="value">{{ $template->objectiveRatingScale?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Values Scale</td><td class="value">{{ $template->competencyRatingScale?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Overall Scale</td><td class="value">{{ $template->overallRatingScale?->name ?? '—' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- ====================================================== OBJECTIVE ITEMS --}}
    <div class="section">
        <h2>Objective Items</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:24px;">#</th>
                    <th style="width:14%;">Perspective</th>
                    <th style="width:22%;">Title</th>
                    <th>Description</th>
                    <th style="width:8%;">Weight</th>
                    <th style="width:8%;">Required</th>
                    <th style="width:15%;">Evidence Hint</th>
                </tr>
            </thead>
            <tbody>
                @forelse($objectiveItems as $i => $item)
                    <tr>
                        <td>{{ $i + 1 }}</td>
                        <td>{{ $item->perspective?->name ?? '—' }}</td>
                        <td><strong>{{ $item->title ?? '—' }}</strong></td>
                        <td>{{ \Illuminate\Support\Str::limit($item->description ?? '—', 220) }}</td>
                        <td>{{ $item->default_weight !== null ? $item->default_weight.'%' : '—' }}</td>
                        <td>{{ $item->is_required ? 'Yes' : 'No' }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($item->evidence_source_hint ?? '—', 100) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="7" class="muted">No objective items configured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ====================================================== VALUES ITEMS --}}
    <div class="section">
        <h2>Values / Behaviour Items</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:24px;">#</th>
                    <th style="width:22%;">Value</th>
                    <th style="width:22%;">Title</th>
                    <th>Description</th>
                    <th style="width:10%;">Required</th>
                </tr>
            </thead>
            <tbody>
                @forelse($valueItems as $i => $item)
                    <tr>
                        <td>{{ $i + 1 }}</td>
                        <td><strong>{{ $item->competency?->name ?? '—' }}</strong></td>
                        <td>{{ $item->title ?? '—' }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($item->description ?? '—', 220) }}</td>
                        <td>{{ $item->is_required ? 'Yes' : 'No' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">No values items configured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ====================================================== RATING SCALES --}}
    @foreach([
        ['Objective Scale', $template->objectiveRatingScale],
        ['Values Scale', $template->competencyRatingScale],
        ['Overall Scale', $template->overallRatingScale],
    ] as [$label, $scale])
        <div class="section">
            <h2>{{ $label }}</h2>
            @if($scale)
                <div class="muted small" style="margin-bottom:4px;">{{ $scale->name }} · {{ $scale->code }}</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:60px;">Short</th>
                            <th>Label</th>
                            <th style="width:80px;">Value</th>
                            <th style="width:140px;">Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($scale->levels->sortBy('sort_order') as $level)
                            <tr>
                                <td>{{ $level->short_label ?? '—' }}</td>
                                <td>{{ $level->label ?? '—' }}</td>
                                <td>{{ $level->value ?? '—' }}</td>
                                <td>
                                    @if($level->min_percent !== null || $level->max_percent !== null)
                                        {{ $level->min_percent ?? '—' }}% – {{ $level->max_percent ?? '—' }}%
                                    @else
                                        —
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr><td colspan="4" class="muted">No levels configured.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            @else
                <div class="muted">Not configured.</div>
            @endif
        </div>
    @endforeach

    {{-- ====================================================== FOOTER --}}
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="generated-by">
                    @if($reportFooter)
                        {{ $reportFooter }} &nbsp;·&nbsp;
                    @endif
                    Generated by {{ $exportedBy }} on {{ $exportedAt->format('d M Y H:i') }}
                </td>
                <td class="right powered-by">
                    @if($poweredByExists)
                        <span class="label">Powered by</span>
                        <img src="{{ $poweredByPath }}" alt="TJT">
                    @endif
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
