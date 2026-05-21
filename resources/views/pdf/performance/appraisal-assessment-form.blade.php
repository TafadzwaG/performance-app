@php
    use App\Enums\CommentType;
    use Illuminate\Support\Str;

    $reviewPeriod = trim(
        (optional($appraisal->reviewCycle?->start_date)->format('d M Y') ?: '').
        ' - '.
        (optional($appraisal->reviewCycle?->end_date)->format('d M Y') ?: '')
    );
    $reviewPeriod = $reviewPeriod !== '-' ? $reviewPeriod : ($appraisal->cycle_name_snapshot ?? 'Not specified');
    $achievementComments = $appraisal->comments->filter(fn ($comment) => $comment->comment_type === CommentType::AchievementNote);
    $issueComments = $appraisal->comments->filter(fn ($comment) => $comment->comment_type === CommentType::SignificantIssue);
    $generalComments = $appraisal->comments->filter(fn ($comment) => $comment->comment_type === CommentType::General);
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>INDIVIDUAL PERFORMANCE ASSESSMENT FORM</title>
    <style>
        @page { margin: 20px; }
        body {
            color: #111827;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 10px;
            line-height: 1.35;
        }
        h1 {
            font-size: 16px;
            margin: 0 0 12px;
            text-align: center;
            text-transform: uppercase;
        }
        h2 {
            background: #e5e7eb;
            border: 1px solid #111827;
            font-size: 11px;
            margin: 12px 0 0;
            padding: 5px 7px;
            text-transform: uppercase;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #111827;
            padding: 5px;
            vertical-align: top;
        }
        th {
            background: #f3f4f6;
            font-weight: 700;
            text-align: left;
        }
        .meta td:first-child,
        .signoff td:first-child {
            background: #f9fafb;
            font-weight: 700;
            width: 16%;
        }
        .muted {
            color: #4b5563;
        }
        .comment-box {
            min-height: 42px;
        }
        .scale-table td:first-child,
        .scale-table th:first-child {
            width: 12%;
        }
        .footer {
            color: #6b7280;
            font-size: 8px;
            margin-top: 12px;
            text-align: right;
        }
    </style>
</head>
<body>
    <h1>INDIVIDUAL PERFORMANCE ASSESSMENT FORM</h1>

    <table class="meta">
        <tr>
            <td>Employee Name</td>
            <td>{{ $appraisal->employee_name_snapshot }}</td>
            <td>Job Title</td>
            <td>{{ $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? 'Not specified') }}</td>
        </tr>
        <tr>
            <td>Department</td>
            <td>{{ $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? 'Not specified') }}</td>
            <td>Review Period</td>
            <td>{{ $reviewPeriod }}</td>
        </tr>
        <tr>
            <td>Line Manager</td>
            <td>{{ $appraisal->lineManager?->name ?? 'Not specified' }}</td>
            <td>Approving Manager</td>
            <td>{{ $appraisal->approvingManager?->name ?? 'Not specified' }}</td>
        </tr>
    </table>

    <h2>Business Objectives</h2>
    <table>
        <thead>
            <tr>
                <th>Perspective</th>
                <th>Objective (The Goal)</th>
                <th>KPI / Measure (How Measured)</th>
                <th>Target (Success Definition)</th>
                <th>Weight</th>
                <th>Evidence Source</th>
                <th>Performance Achieved</th>
                <th>Self Rating</th>
                <th>Manager&rsquo;s Rating</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($appraisal->objectives as $objective)
                <tr>
                    <td>{{ $objective->perspective?->name ?? 'Not specified' }}</td>
                    <td>{{ $objective->title }}</td>
                    <td>{{ $objective->kpi_measure ?: 'Not specified' }}</td>
                    <td>{{ $objective->target_definition ?: 'Not specified' }}</td>
                    <td>{{ $objective->weight !== null ? rtrim(rtrim(number_format((float) $objective->weight, 2), '0'), '.').'%' : 'Not specified' }}</td>
                    <td>{{ $objective->evidence_source ?: 'Not specified' }}</td>
                    <td>{{ $objective->performance_achieved ?: 'Not captured' }}</td>
                    <td>{{ $objective->selfRatingLevel?->label ?? $objective->self_rating_score ?? 'Not rated' }}</td>
                    <td>{{ $objective->managerRatingLevel?->label ?? $objective->manager_rating_score ?? 'Not rated' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" class="muted">No objectives captured.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Other substantial achievements</h2>
    <div class="comment-box">
        @forelse ($achievementComments as $comment)
            <p>{{ $comment->body }}</p>
        @empty
            <p class="muted">No achievement comments captured.</p>
        @endforelse
    </div>

    <h2>Significant issues</h2>
    <div class="comment-box">
        @forelse ($issueComments as $comment)
            <p>{{ $comment->body }}</p>
        @empty
            <p class="muted">No significant issues captured.</p>
        @endforelse
    </div>

    <h2>Comments</h2>
    <table>
        <tr>
            <th>Individual Comments</th>
            <th>Manager Comments</th>
            <th>Approving Manager Comments</th>
        </tr>
        <tr>
            <td class="comment-box">
                @foreach ($generalComments as $comment)
                    <p>{{ $comment->body }}</p>
                @endforeach
            </td>
            <td class="comment-box">
                @foreach ($appraisal->objectives->whereNotNull('manager_comment') as $objective)
                    <p>{{ $objective->manager_comment }}</p>
                @endforeach
            </td>
            <td class="comment-box"></td>
        </tr>
    </table>

    <h2>Sign-off</h2>
    <table class="signoff">
        <tr>
            <td>Employee</td>
            <td></td>
            <td>Date</td>
            <td></td>
        </tr>
        <tr>
            <td>Manager</td>
            <td></td>
            <td>Date</td>
            <td></td>
        </tr>
        <tr>
            <td>Approving Manager</td>
            <td></td>
            <td>Date</td>
            <td></td>
        </tr>
    </table>

    <h2>BUSINESS OBJECTIVES RATING SCALE</h2>
    <table class="scale-table">
        <tr>
            <th>Rating</th>
            <th>Description</th>
            <th>Range</th>
        </tr>
        @foreach (($appraisal->template?->objectiveRatingScale?->levels ?? collect()) as $level)
            <tr>
                <td>{{ $level->short_label }}</td>
                <td>
                    <strong>{{ $level->label }}</strong>
                    @if ($level->description)
                        <br>{{ $level->description }}
                    @endif
                </td>
                <td>
                    @if ($level->min_percent !== null || $level->max_percent !== null)
                        @if ($level->max_percent === null)
                            {{ $level->min_percent ?? '0' }}+%
                        @else
                            {{ $level->min_percent ?? '0' }}% - {{ $level->max_percent }}%
                        @endif
                    @else
                        Score {{ rtrim(rtrim(number_format((float) $level->value, 2), '0'), '.') }}
                    @endif
                </td>
            </tr>
        @endforeach
    </table>

    <h2>VALUES OBJECTIVES RATING SCALE</h2>
    <table class="scale-table">
        <tr>
            <th>Rating</th>
            <th>Description</th>
        </tr>
        @foreach (($appraisal->template?->competencyRatingScale?->levels ?? collect()) as $level)
            <tr>
                <td>{{ $level->short_label }}</td>
                <td>
                    <strong>{{ $level->label }}</strong>
                    @if ($level->description)
                        <br>{{ $level->description }}
                    @endif
                </td>
            </tr>
        @endforeach
    </table>

    <div class="footer">
        {{ $companyName ?? 'Monomotapa' }} | Exported {{ optional($exportedAt ?? now())->format('d M Y H:i') }}
    </div>
</body>
</html>
