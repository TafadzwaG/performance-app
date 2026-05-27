@php
    $headerReportLabel = 'Employee Performance Appraisal';
@endphp
@extends('pdf.layouts.studio-export')

@section('title', 'Appraisal Export — '.$appraisal->employee_name_snapshot)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Performance Appraisal</div>
        <div class="title">{{ $appraisal->employee_name_snapshot }}</div>
        <div class="meta">
            <span class="pill">{{ $statusLabel ?? str((string) ($appraisal->status?->value ?? $appraisal->status))->replace('_', ' ')->title() }}</span>
            · {{ $appraisal->cycle_name_snapshot }}
            · {{ $appraisal->template_name_snapshot }}
            · Employee #{{ $appraisal->employee_number_snapshot }}
        </div>
    </div>

    <div class="section">
        <h2>Employee &amp; Workflow</h2>
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td style="width:50%; vertical-align:top; padding-right:8px;">
                    <table class="kv-table">
                        <tr><td class="label">Employee</td><td>{{ $appraisal->employee_name_snapshot }}</td></tr>
                        <tr><td class="label">Email</td><td>{{ $appraisal->employee_email_snapshot }}</td></tr>
                        <tr><td class="label">Number</td><td>{{ $appraisal->employee_number_snapshot }}</td></tr>
                        <tr><td class="label">Department</td><td>{{ $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? '—') }}</td></tr>
                        <tr><td class="label">Job Title</td><td>{{ $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? '—') }}</td></tr>
                    </table>
                </td>
                <td style="width:50%; vertical-align:top;">
                    <table class="kv-table">
                        <tr><td class="label">Line Manager</td><td>{{ $appraisal->lineManager?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Approver</td><td>{{ $appraisal->approvingManager?->name ?? '—' }}</td></tr>
                        <tr><td class="label">Approved</td><td>{{ optional($appraisal->approved_at)->format('d M Y H:i') ?? '—' }}</td></tr>
                        <tr><td class="label">Calibrated</td><td>{{ optional($appraisal->calibrated_at)->format('d M Y H:i') ?? '—' }}</td></tr>
                        <tr><td class="label">Finalized</td><td>{{ optional($appraisal->finalized_at)->format('d M Y H:i') ?? '—' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Score Summary</h2>
        <table class="stat-band">
            <tr>
                <td>
                    <div class="num">{{ $appraisal->business_score !== null ? \App\Support\Performance\ScoreFormatter::formatPercent($appraisal->business_score) : '—' }}</div>
                    <div class="lbl">Business</div>
                </td>
                <td>
                    <div class="num">{{ $appraisal->values_score !== null ? \App\Support\Performance\ScoreFormatter::formatPercent($appraisal->values_score) : '—' }}</div>
                    <div class="lbl">Values</div>
                </td>
                <td>
                    <div class="num">{{ ($effectiveScore ?? null) !== null ? \App\Support\Performance\ScoreFormatter::formatPercent($effectiveScore) : '—' }}</div>
                    <div class="lbl">Overall</div>
                </td>
                <td>
                    <div class="num" style="font-size:12px;">{{ $effectiveRating ?? 'Unrated' }}</div>
                    <div class="lbl">Final Rating</div>
                </td>
            </tr>
        </table>
    </div>

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
                                <br><span class="muted">{{ \Illuminate\Support\Str::limit($objective->employee_comment, 200) }}</span>
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
                            {{ ($appraisal->latestCalibration->original_overall_score ?? null) !== null ? \App\Support\Performance\ScoreFormatter::formatPercent($appraisal->latestCalibration->original_overall_score) : '—' }}
                            @if($appraisal->latestCalibration->originalOverallRatingLevel?->label)
                                <br><span class="muted">{{ $appraisal->latestCalibration->originalOverallRatingLevel->label }}</span>
                            @endif
                        </td>
                        <td>
                            {{ ($appraisal->latestCalibration->calibrated_overall_score ?? $effectiveScore ?? null) !== null ? \App\Support\Performance\ScoreFormatter::formatPercent($appraisal->latestCalibration->calibrated_overall_score ?? $effectiveScore) : '—' }}
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

    <div class="section">
        <h2>Development Plan</h2>
        <table class="kv-table">
            <tr><td class="label">Strengths</td><td>{{ $appraisal->developmentPlan?->strengths ?? '—' }}</td></tr>
            <tr><td class="label">Improvement</td><td>{{ $appraisal->developmentPlan?->improvement_areas ?? '—' }}</td></tr>
            <tr><td class="label">Follow Up</td><td>{{ $appraisal->developmentPlan?->follow_up_notes ?? '—' }}</td></tr>
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
@endsection
