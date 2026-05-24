@php
    $headerReportLabel = 'Appraisal Template';
@endphp
@extends('pdf.layouts.studio-export')

@section('title', 'Template — '.$template->name)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Performance Setup</div>
        <div class="title">{{ $template->name }}</div>
        <div class="meta">
            {{ $template->code ?? '—' }}
            @if ($template->description)
                · {{ \Illuminate\Support\Str::limit($template->description, 120) }}
            @endif
        </div>
    </div>

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

    <div class="section">
        <h2>Overview &amp; Scope</h2>
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td style="width:50%; vertical-align:top; padding-right:8px;">
                    <table class="kv-table">
                        <tr><td class="label">Code</td><td>{{ $template->code ?? '—' }}</td></tr>
                        <tr><td class="label">Version</td><td>v{{ $template->version ?? 1 }}</td></tr>
                        <tr><td class="label">Description</td><td>{{ \Illuminate\Support\Str::limit($template->description ?? '—', 220) }}</td></tr>
                        <tr><td class="label">Allow values</td><td>{{ $template->allow_competencies ? 'Yes' : 'No' }}</td></tr>
                    </table>
                </td>
                <td style="width:50%; vertical-align:top;">
                    <table class="kv-table">
                        <tr><td class="label">Department</td><td>{{ $template->department?->name ?? 'All departments' }}</td></tr>
                        <tr><td class="label">Job Title</td><td>{{ $template->jobTitle?->name ?? 'All job titles' }}</td></tr>
                        <tr><td class="label">Objective Scale</td><td>{{ $template->objectiveRatingScale?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Values Scale</td><td>{{ $template->competencyRatingScale?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Overall Scale</td><td>{{ $template->overallRatingScale?->name ?? '—' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

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
                        <td><strong>{{ $item->displayValueName() }}</strong></td>
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

    @foreach([
        ['Objective Scale', $template->objectiveRatingScale],
        ['Values Scale', $template->competencyRatingScale],
        ['Overall Scale', $template->overallRatingScale],
    ] as [$label, $scale])
        <div class="section">
            <h2>{{ $label }}</h2>
            @if($scale)
                <div class="muted" style="margin-bottom:4px;">{{ $scale->name }} · {{ $scale->code }}</div>
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
@endsection
