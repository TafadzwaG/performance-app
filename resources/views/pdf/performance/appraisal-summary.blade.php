<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Appraisal Summary</title>
    <style>
        @page {
            margin: 24px 28px 32px 28px;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            font-size: 9px;
            line-height: 1.4;
        }

        h1 {
            font-size: 16px;
            margin: 0 0 4px;
        }

        h2 {
            font-size: 11.5px;
            margin: 0 0 6px;
        }

        h3 {
            font-size: 10px;
            margin: 0 0 4px;
        }

        .section {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }

        .muted {
            color: #6b7280;
            font-size: 8.5px;
        }

        .grid {
            width: 100%;
        }

        .grid td {
            vertical-align: top;
            padding: 4px 6px 4px 0;
        }

        .score-table,
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }

        .score-table th,
        .score-table td,
        .data-table th,
        .data-table td {
            border: 1px solid #d1d5db;
            padding: 4px 6px;
            text-align: left;
            vertical-align: top;
            font-size: 9px;
        }

        .score-table th,
        .data-table th {
            background: #f3f4f6;
            font-size: 8.5px;
        }

        .pill {
            display: inline-block;
            padding: 2px 6px;
            border: 1px solid #d1d5db;
            border-radius: 999px;
            font-size: 8.5px;
        }

        .pdf-footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: -16px;
            padding-top: 4px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 8px;
        }

        .pdf-footer table {
            width: 100%;
            border-collapse: collapse;
        }

        .pdf-footer td {
            vertical-align: middle;
        }

        .pdf-footer .right {
            text-align: right;
            white-space: nowrap;
        }

        .pdf-footer .label {
            font-size: 7px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #9ca3af;
            margin-right: 4px;
        }

        .pdf-footer img {
            height: 16px;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    @php
        $effectiveOverallScore = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;
        $effectiveOverallRating = $appraisal->calibratedOverallRatingLevel?->label ?? $appraisal->overallRatingLevel?->label ?? 'Unrated';
    @endphp
    <div class="section">
        <h1>Employee Performance Appraisal</h1>
        <div class="muted">{{ $appraisal->cycle_name_snapshot }} | {{ $appraisal->template_name_snapshot }}</div>
    </div>

    <div class="section">
        <table class="grid">
            <tr>
                <td width="50%">
                    <h3>Employee</h3>
                    <div><strong>Name:</strong> {{ $appraisal->employee_name_snapshot }}</div>
                    <div><strong>Email:</strong> {{ $appraisal->employee_email_snapshot }}</div>
                    <div><strong>Employee No:</strong> {{ $appraisal->employee_number_snapshot }}</div>
                    <div><strong>Department:</strong> {{ $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? 'N/A') }}</div>
                    <div><strong>Job Title:</strong> {{ $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? 'N/A') }}</div>
                </td>
                <td width="50%">
                    <h3>Workflow</h3>
                    <div><strong>Status:</strong> <span class="pill">{{ str((string) ($appraisal->status?->value ?? $appraisal->status))->replace('_', ' ')->title() }}</span></div>
                    <div><strong>Line Manager:</strong> {{ $appraisal->lineManager?->name ?? 'N/A' }}</div>
                    <div><strong>Approving Manager:</strong> {{ $appraisal->approvingManager?->name ?? 'N/A' }}</div>
                    <div><strong>Approved At:</strong> {{ $appraisal->approved_at ?? 'N/A' }}</div>
                    <div><strong>Calibrated At:</strong> {{ $appraisal->calibrated_at ?? 'N/A' }}</div>
                    <div><strong>Finalized At:</strong> {{ $appraisal->finalized_at ?? 'N/A' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Score Summary</h2>
        <table class="score-table">
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
            <h2>Calibration Summary</h2>
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
        <h2>Objectives</h2>
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
                    <tr>
                        <td colspan="8">No objectives captured.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Values</h2>
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
                    <tr>
                        <td colspan="5">No competency ratings captured.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

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
                        <td>{{ str((string) ($comment->comment_type?->value ?? $comment->comment_type))->replace('_', ' ')->title() }}</td>
                        <td>{{ $comment->author?->name ?? 'System' }}</td>
                        <td>{{ $comment->body }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="3">No comments captured.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Approvals and History</h2>
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
                    <tr>
                        <td colspan="5">No approval actions captured.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Development Plan</h2>
        <div><strong>Strengths:</strong> {{ $appraisal->developmentPlan?->strengths ?? 'N/A' }}</div>
        <div><strong>Improvement Areas:</strong> {{ $appraisal->developmentPlan?->improvement_areas ?? 'N/A' }}</div>
        <div><strong>Follow Up Notes:</strong> {{ $appraisal->developmentPlan?->follow_up_notes ?? 'N/A' }}</div>

        <table class="data-table" style="margin-top: 10px;">
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
                    <tr>
                        <td colspan="5">No development actions captured.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="pdf-footer">
        <table>
            <tr>
                <td>{{ $appraisal->cycle_name_snapshot }} · {{ $appraisal->employee_name_snapshot }}</td>
                <td class="right">
                    @if(!empty($poweredByExists))
                        <span class="label">Powered by</span>
                        <img src="{{ $poweredByPath }}" alt="TJT">
                    @endif
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
