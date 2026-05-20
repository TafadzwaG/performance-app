<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Appraisal Export — {{ $appraisal->employee_name_snapshot }}</title>
    <style>
        @page {
            margin: 32px 36px 48px 36px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #252627;
            font-size: 10.5px;
            line-height: 1.45;
        }

        h1, h2, h3, h4 {
            margin: 0;
        }

        .header {
            border-bottom: 2px solid #BFB48F;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }

        .header table {
            width: 100%;
            border-collapse: collapse;
        }

        .header td {
            vertical-align: middle;
        }

        .header .logo {
            width: 110px;
        }

        .header .logo img {
            max-width: 100px;
            max-height: 60px;
        }

        .header .company {
            font-size: 16px;
            font-weight: bold;
            color: #252627;
            letter-spacing: -0.01em;
        }

        .header .address {
            color: #5F5A4A;
            font-size: 9.5px;
        }

        .header .right {
            text-align: right;
        }

        .eyebrow {
            font-size: 9px;
            color: #8A8268;
            text-transform: uppercase;
            letter-spacing: 0.22em;
            margin-bottom: 4px;
        }

        .title-block {
            margin: 4px 0 6px;
        }

        .title-block .title {
            font-size: 22px;
            font-weight: normal;
            color: #252627;
            letter-spacing: -0.02em;
        }

        .title-block .meta {
            color: #5F5A4A;
            font-size: 10.5px;
        }

        .section {
            margin-bottom: 14px;
            page-break-inside: avoid;
        }

        .section h2 {
            font-size: 12.5px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #2F4A3F;
            border-bottom: 1px solid #EFE9D8;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }

        .info-grid {
            width: 100%;
            border-collapse: collapse;
        }

        .info-grid td {
            padding: 4px 8px 4px 0;
            vertical-align: top;
        }

        .info-grid .label {
            color: #8A8268;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-weight: bold;
            width: 130px;
        }

        .info-grid .value {
            color: #252627;
            font-size: 11px;
        }

        .pill {
            display: inline-block;
            padding: 2px 8px;
            border: 1px solid #BFB48F;
            background: #F3EEDD;
            color: #252627;
            border-radius: 999px;
            font-size: 9.5px;
            font-weight: bold;
            letter-spacing: 0.04em;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #BFB48F;
        }

        .data-table thead th {
            background: #252627;
            color: #ffffff;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #252627;
        }

        .data-table tbody td {
            border: 1px solid #E4DDC4;
            padding: 6px 8px;
            color: #252627;
            font-size: 10px;
            vertical-align: top;
        }

        .data-table tbody tr:nth-child(even) td {
            background: #FBF9F0;
        }

        .score-band {
            display: table;
            width: 100%;
            background: #252627;
            color: #ffffff;
            border-radius: 4px;
            padding: 6px 0;
        }

        .score-band .cell {
            display: table-cell;
            text-align: center;
            padding: 4px 12px;
            border-right: 1px solid rgba(255, 255, 255, 0.2);
        }

        .score-band .cell:last-child {
            border-right: 0;
        }

        .score-band .num {
            font-size: 22px;
            color: #BFB48F;
            font-weight: bold;
        }

        .score-band .lbl {
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 2px;
        }

        .footer {
            position: fixed;
            bottom: -24px;
            left: 0;
            right: 0;
            color: #8A8268;
            font-size: 8.5px;
            font-style: italic;
            border-top: 1px solid #EFE9D8;
            padding-top: 6px;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            vertical-align: middle;
        }

        .footer-table .right {
            text-align: right;
            white-space: nowrap;
        }

        .powered-by {
            font-style: normal;
            color: #5F5A4A;
        }

        .powered-by .label {
            font-size: 7px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #8A8268;
            margin-right: 4px;
        }

        .powered-by img {
            height: 18px;
            vertical-align: middle;
        }

        .muted { color: #8A8268; }
        .strong { font-weight: bold; }
    </style>
</head>
<body>
    {{-- ================================================== HEADER --}}
    <div class="header">
        <table>
            <tr>
                <td class="logo">
                    @if($logoExists)
                        <img src="{{ $logoPath }}" alt="{{ $companyName }}">
                    @endif
                </td>
                <td>
                    <div class="company">{{ $companyName }}</div>
                    @if($companyAddress)
                        <div class="address">{{ $companyAddress }}</div>
                    @endif
                </td>
                <td class="right">
                    <div class="eyebrow">§ Exported</div>
                    <div class="muted" style="font-size:10px;">
                        By <span class="strong">{{ $exportedBy }}</span><br>
                        {{ $exportedAt->format('d M Y · H:i') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ================================================== TITLE --}}
    <div class="section">
        <div class="eyebrow">§ Employee Performance Appraisal</div>
        <div class="title-block">
            <div class="title">{{ $appraisal->employee_name_snapshot }}</div>
            <div class="meta">
                <span class="pill">{{ $statusLabel }}</span>
                &nbsp;{{ $appraisal->cycle_name_snapshot }} &nbsp;·&nbsp; {{ $appraisal->template_name_snapshot }}
                &nbsp;·&nbsp; Employee #{{ $appraisal->employee_number_snapshot }}
            </div>
        </div>
    </div>

    {{-- ================================================== EMPLOYEE / WORKFLOW --}}
    <div class="section">
        <h2>Employee &amp; Workflow</h2>
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td style="width:50%; vertical-align:top; padding-right:14px;">
                    <table class="info-grid">
                        <tr><td class="label">Employee</td><td class="value">{{ $appraisal->employee_name_snapshot }}</td></tr>
                        <tr><td class="label">Email</td><td class="value">{{ $appraisal->employee_email_snapshot }}</td></tr>
                        <tr><td class="label">Number</td><td class="value">{{ $appraisal->employee_number_snapshot }}</td></tr>
                        <tr><td class="label">Department</td><td class="value">{{ $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? '—') }}</td></tr>
                        <tr><td class="label">Job Title</td><td class="value">{{ $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? '—') }}</td></tr>
                    </table>
                </td>
                <td style="width:50%; vertical-align:top;">
                    <table class="info-grid">
                        <tr><td class="label">Line Manager</td><td class="value">{{ $appraisal->lineManager?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Approver</td><td class="value">{{ $appraisal->approvingManager?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Approved</td><td class="value">{{ optional($appraisal->approved_at)->format('d M Y H:i') ?? '—' }}</td></tr>
                        <tr><td class="label">Calibrated</td><td class="value">{{ optional($appraisal->calibrated_at)->format('d M Y H:i') ?? '—' }}</td></tr>
                        <tr><td class="label">Finalized</td><td class="value">{{ optional($appraisal->finalized_at)->format('d M Y H:i') ?? '—' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- ================================================== SCORE BAND --}}
    <div class="section">
        <h2>Score Summary</h2>
        <div class="score-band">
            <div class="cell">
                <div class="num">{{ $appraisal->business_score !== null ? number_format((float) $appraisal->business_score, 1) : '—' }}</div>
                <div class="lbl">Business</div>
            </div>
            <div class="cell">
                <div class="num">{{ $appraisal->values_score !== null ? number_format((float) $appraisal->values_score, 1) : '—' }}</div>
                <div class="lbl">Values</div>
            </div>
            <div class="cell">
                <div class="num">{{ $effectiveScore !== null ? number_format((float) $effectiveScore, 1) : '—' }}</div>
                <div class="lbl">Overall</div>
            </div>
            <div class="cell">
                <div class="num" style="font-size:14px;">{{ $effectiveRating }}</div>
                <div class="lbl">Final Rating</div>
            </div>
        </div>
    </div>

    {{-- ================================================== OBJECTIVES --}}
    <div class="section">
        <h2>Objectives</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Perspective</th>
                    <th style="width:24%;">Objective</th>
                    <th>KPI / Measure</th>
                    <th>Target</th>
                    <th>Weight</th>
                    <th>Achieved</th>
                    <th>Self</th>
                    <th>Manager</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->objectives as $objective)
                    <tr>
                        <td>{{ $objective->perspective?->name ?? '—' }}</td>
                        <td>
                            <strong>{{ $objective->title }}</strong>
                            @if($objective->employee_comment)
                                <br><span class="muted" style="font-size:9.5px;">{{ \Illuminate\Support\Str::limit($objective->employee_comment, 200) }}</span>
                            @endif
                        </td>
                        <td>{{ \Illuminate\Support\Str::limit($objective->kpi_measure ?? '—', 80) }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($objective->target_definition ?? '—', 60) }}</td>
                        <td>{{ $objective->weight !== null ? $objective->weight.'%' : '—' }}</td>
                        <td>{{ $objective->performance_achieved ?? '—' }}</td>
                        <td>{{ $objective->selfRatingLevel?->label ?? $objective->self_rating_score ?? '—' }}</td>
                        <td>{{ $objective->managerRatingLevel?->label ?? $objective->manager_rating_score ?? '—' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="8" class="muted">No objectives captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ================================================== VALUES --}}
    <div class="section">
        <h2>Values</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:18%;">Value</th>
                    <th>Self Rating</th>
                    <th>Manager Rating</th>
                    <th>Employee Comment</th>
                    <th>Manager Comment</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->competencyRatings as $rating)
                    <tr>
                        <td><strong>{{ $rating->competency?->name ?? '—' }}</strong></td>
                        <td>{{ $rating->selfRatingLevel?->label ?? $rating->self_rating_score ?? '—' }}</td>
                        <td>{{ $rating->managerRatingLevel?->label ?? $rating->manager_rating_score ?? '—' }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($rating->employee_comment ?? '—', 180) }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($rating->manager_comment ?? '—', 180) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">No value ratings captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ================================================== CALIBRATION --}}
    @if($appraisal->latestCalibration)
        <div class="section">
            <h2>Calibration</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Decision</th>
                        <th>Actor</th>
                        <th>Original</th>
                        <th>Calibrated</th>
                        <th>Comments</th>
                        <th>Evidence</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ \Illuminate\Support\Str::of($appraisal->latestCalibration->decision->value ?? $appraisal->latestCalibration->decision)->replace('_', ' ')->title() }}</td>
                        <td>{{ $appraisal->latestCalibration->actor?->name ?? 'System' }}</td>
                        <td>
                            {{ $appraisal->latestCalibration->original_overall_score ?? '—' }}
                            @if($appraisal->latestCalibration->originalOverallRatingLevel?->label)
                                <br><span class="muted">{{ $appraisal->latestCalibration->originalOverallRatingLevel->label }}</span>
                            @endif
                        </td>
                        <td>
                            {{ $appraisal->latestCalibration->calibrated_overall_score ?? $effectiveScore ?? '—' }}
                            @if($appraisal->calibratedOverallRatingLevel?->label)
                                <br><span class="muted">{{ $appraisal->calibratedOverallRatingLevel->label }}</span>
                            @endif
                        </td>
                        <td>{{ \Illuminate\Support\Str::limit($appraisal->latestCalibration->comments ?? $appraisal->calibration_comment ?? '—', 200) }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($appraisal->latestCalibration->evidence_summary ?? '—', 200) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endif

    {{-- ================================================== COMMENTS --}}
    <div class="section">
        <h2>Comments</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Author</th>
                    <th>Comment</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->comments as $comment)
                    <tr>
                        <td>{{ \Illuminate\Support\Str::of((string) ($comment->comment_type?->value ?? $comment->comment_type))->replace('_', ' ')->title() }}</td>
                        <td>{{ $comment->author?->name ?? 'System' }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($comment->body ?? '—', 360) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="muted">No comments captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ================================================== APPROVALS --}}
    <div class="section">
        <h2>Approvals &amp; History</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Stage</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Date</th>
                    <th>Comments</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->approvals as $approval)
                    <tr>
                        <td>{{ \Illuminate\Support\Str::of((string) ($approval->stage?->value ?? $approval->stage))->replace('_', ' ')->title() }}</td>
                        <td>{{ \Illuminate\Support\Str::of((string) ($approval->action?->value ?? $approval->action))->replace('_', ' ')->title() }}</td>
                        <td>{{ $approval->actor?->name ?? 'System' }}</td>
                        <td>{{ optional($approval->acted_at)->format('d M Y H:i') ?? '—' }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($approval->comments ?? '—', 200) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">No approval actions captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ================================================== DEVELOPMENT PLAN --}}
    <div class="section">
        <h2>Development Plan</h2>
        <table class="info-grid">
            <tr><td class="label">Strengths</td><td class="value">{{ $appraisal->developmentPlan?->strengths ?? '—' }}</td></tr>
            <tr><td class="label">Improvement</td><td class="value">{{ $appraisal->developmentPlan?->improvement_areas ?? '—' }}</td></tr>
            <tr><td class="label">Follow Up</td><td class="value">{{ $appraisal->developmentPlan?->follow_up_notes ?? '—' }}</td></tr>
        </table>

        <table class="data-table" style="margin-top: 8px;">
            <thead>
                <tr>
                    <th>Action</th>
                    <th>Owner</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Follow Up</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->developmentPlan?->actions ?? [] as $action)
                    <tr>
                        <td>{{ $action->action }}</td>
                        <td>{{ $action->owner?->name ?? '—' }}</td>
                        <td>{{ optional($action->due_date)->format('d M Y') ?? '—' }}</td>
                        <td>{{ (string) ($action->status?->value ?? $action->status) ?: '—' }}</td>
                        <td>{{ (string) ($action->follow_up_status?->value ?? $action->follow_up_status) ?: '—' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">No development actions captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td>
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
