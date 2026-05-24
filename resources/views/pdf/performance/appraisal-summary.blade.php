@php
    $effectiveOverallScore = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;
    $effectiveOverallRating = $appraisal->calibratedOverallRatingLevel?->label ?? $appraisal->overallRatingLevel?->label ?? 'Unrated';
    $headerReportLabel = 'Appraisal Summary';
@endphp
@extends('pdf.layouts.studio-export')

@section('title', 'Appraisal Summary — '.$appraisal->employee_name_snapshot)

@section('content')
    <div class="title-block">
        <div class="eyebrow">§ Performance Appraisal</div>
        <div class="title">{{ $appraisal->employee_name_snapshot }}</div>
        <div class="meta">{{ $appraisal->cycle_name_snapshot }} · {{ $appraisal->template_name_snapshot }}</div>
    </div>

    <div class="section">
        <h2>§ Employee &amp; Workflow</h2>
        <table style="width:100%; border-collapse:collapse;">
            <tr>
                <td style="width:50%; vertical-align:top; padding-right:8px;">
                    <table class="kv-table">
                        <tr><td class="label">Name</td><td>{{ $appraisal->employee_name_snapshot }}</td></tr>
                        <tr><td class="label">Email</td><td>{{ $appraisal->employee_email_snapshot }}</td></tr>
                        <tr><td class="label">Employee No</td><td>{{ $appraisal->employee_number_snapshot }}</td></tr>
                        <tr><td class="label">Department</td><td>{{ $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? 'N/A') }}</td></tr>
                        <tr><td class="label">Job Title</td><td>{{ $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? 'N/A') }}</td></tr>
                    </table>
                </td>
                <td style="width:50%; vertical-align:top;">
                    <table class="kv-table">
                        <tr>
                            <td class="label">Status</td>
                            <td><span class="pill">{{ str((string) ($appraisal->status?->value ?? $appraisal->status))->replace('_', ' ')->title() }}</span></td>
                        </tr>
                        <tr><td class="label">Line Manager</td><td>{{ $appraisal->lineManager?->name ?? 'N/A' }}</td></tr>
                        <tr><td class="label">Approving Manager</td><td>{{ $appraisal->approvingManager?->name ?? 'N/A' }}</td></tr>
                        <tr><td class="label">Approved At</td><td>{{ $appraisal->approved_at ?? 'N/A' }}</td></tr>
                        <tr><td class="label">Calibrated At</td><td>{{ $appraisal->calibrated_at ?? 'N/A' }}</td></tr>
                        <tr><td class="label">Finalized At</td><td>{{ $appraisal->finalized_at ?? 'N/A' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>§ Score Summary</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Business Score</th>
                    <th>Values Score</th>
                    <th>Overall Score</th>
                    <th>Final Rating</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $appraisal->business_score ?? 'N/A' }}</td>
                    <td>{{ $appraisal->values_score ?? 'N/A' }}</td>
                    <td>{{ $effectiveOverallScore ?? 'N/A' }}</td>
                    <td>{{ $effectiveOverallRating }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    @if($appraisal->latestCalibration)
        <div class="section">
            <h2>§ Calibration Summary</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Decision</th>
                        <th>Actor</th>
                        <th>Original Outcome</th>
                        <th>Calibrated Outcome</th>
                        <th>Comments</th>
                        <th>Evidence Summary</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ str($appraisal->latestCalibration->decision->value ?? $appraisal->latestCalibration->decision)->replace('_', ' ')->title() }}</td>
                        <td>{{ $appraisal->latestCalibration->actor?->name ?? 'N/A' }}</td>
                        <td>
                            {{ $appraisal->latestCalibration->original_overall_score ?? 'N/A' }}
                            @if($appraisal->latestCalibration->originalOverallRatingLevel?->label)
                                ({{ $appraisal->latestCalibration->originalOverallRatingLevel->label }})
                            @endif
                        </td>
                        <td>
                            {{ $appraisal->latestCalibration->calibrated_overall_score ?? $effectiveOverallScore ?? 'N/A' }}
                            @if($appraisal->latestCalibration->calibratedOverallRatingLevel?->label || $appraisal->calibratedOverallRatingLevel?->label)
                                ({{ $appraisal->latestCalibration->calibratedOverallRatingLevel?->label ?? $appraisal->calibratedOverallRatingLevel?->label }})
                            @endif
                        </td>
                        <td>{{ $appraisal->latestCalibration->comments ?? $appraisal->calibration_comment ?? 'N/A' }}</td>
                        <td>{{ $appraisal->latestCalibration->evidence_summary ?? 'N/A' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endif

    <div class="section">
        <h2>§ Objectives</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Perspective</th>
                    <th>Objective</th>
                    <th>KPI / Measure</th>
                    <th>Target</th>
                    <th>Weight</th>
                    <th>Achieved</th>
                    <th>Self Rating</th>
                    <th>Manager Rating</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->objectives as $objective)
                    <tr>
                        <td>{{ $objective->perspective?->name ?? 'N/A' }}</td>
                        <td>
                            <strong>{{ $objective->title }}</strong><br>
                            <span class="muted">{{ $objective->employee_comment ?: $objective->manager_comment ?: '' }}</span>
                        </td>
                        <td>{{ $objective->kpi_measure ?? 'N/A' }}</td>
                        <td>{{ $objective->target_definition ?? 'N/A' }}</td>
                        <td>{{ $objective->weight }}</td>
                        <td>{{ $objective->performance_achieved ?? 'N/A' }}</td>
                        <td>{{ $objective->selfRatingLevel?->label ?? $objective->self_rating_score ?? 'N/A' }}</td>
                        <td>{{ $objective->managerRatingLevel?->label ?? $objective->manager_rating_score ?? 'N/A' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="8" class="muted">No objectives captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>§ Values</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Competency</th>
                    <th>Self Rating</th>
                    <th>Manager Rating</th>
                    <th>Employee Comment</th>
                    <th>Manager Comment</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->competencyRatings as $rating)
                    <tr>
                        <td>{{ $rating->competency?->name ?? 'N/A' }}</td>
                        <td>{{ $rating->selfRatingLevel?->label ?? $rating->self_rating_score ?? 'N/A' }}</td>
                        <td>{{ $rating->managerRatingLevel?->label ?? $rating->manager_rating_score ?? 'N/A' }}</td>
                        <td>{{ $rating->employee_comment ?? 'N/A' }}</td>
                        <td>{{ $rating->manager_comment ?? 'N/A' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">No competency ratings captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>§ Comments</h2>
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
                        <td>{{ str((string) ($comment->comment_type?->value ?? $comment->comment_type))->replace('_', ' ')->title() }}</td>
                        <td>{{ $comment->author?->name ?? 'System' }}</td>
                        <td>{{ $comment->body }}</td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="muted">No comments captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>§ Approvals and History</h2>
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
                        <td>{{ str((string) ($approval->stage?->value ?? $approval->stage))->replace('_', ' ')->title() }}</td>
                        <td>{{ str((string) ($approval->action?->value ?? $approval->action))->replace('_', ' ')->title() }}</td>
                        <td>{{ $approval->actor?->name ?? 'System' }}</td>
                        <td>{{ $approval->acted_at ?? 'N/A' }}</td>
                        <td>{{ $approval->comments ?? 'N/A' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">No approval actions captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>§ Development Plan</h2>
        <table class="kv-table">
            <tr><td class="label">Strengths</td><td>{{ $appraisal->developmentPlan?->strengths ?? 'N/A' }}</td></tr>
            <tr><td class="label">Improvement Areas</td><td>{{ $appraisal->developmentPlan?->improvement_areas ?? 'N/A' }}</td></tr>
            <tr><td class="label">Follow Up Notes</td><td>{{ $appraisal->developmentPlan?->follow_up_notes ?? 'N/A' }}</td></tr>
        </table>

        <table class="data-table" style="margin-top: 8px;">
            <thead>
                <tr>
                    <th>Action</th>
                    <th>Owner</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Follow Up</th>
                </tr>
            </thead>
            <tbody>
                @forelse($appraisal->developmentPlan?->actions ?? [] as $action)
                    <tr>
                        <td>{{ $action->action }}</td>
                        <td>{{ $action->owner?->name ?? 'N/A' }}</td>
                        <td>{{ $action->due_date ?? 'N/A' }}</td>
                        <td>{{ $action->status ?? 'N/A' }}</td>
                        <td>{{ $action->follow_up_status ?? 'N/A' }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">No development actions captured.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
@endsection
