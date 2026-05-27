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

    $headerReportLabel = 'Individual Performance Assessment Form';
@endphp
@extends('pdf.layouts.studio-export')

@section('title', 'Individual Performance Assessment Form — '.$appraisal->employee_name_snapshot)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Performance Appraisal</div>
        <div class="title">Individual Performance Assessment Form</div>
        <div class="meta">
            {{ $appraisal->employee_name_snapshot }}
            · {{ $appraisal->cycle_name_snapshot ?? 'Review cycle not specified' }}
            @if (isset($statusLabel))
                · {{ $statusLabel }}
            @endif
        </div>
    </div>

    <div class="section">
        <h2>Employee Details</h2>
        <table class="kv-table">
            <tr>
                <td class="label">Employee Name</td>
                <td>{{ $appraisal->employee_name_snapshot }}</td>
                <td class="label">Job Title</td>
                <td>{{ $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? 'Not specified') }}</td>
            </tr>
            <tr>
                <td class="label">Department</td>
                <td>{{ $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? 'Not specified') }}</td>
                <td class="label">Review Period</td>
                <td>{{ $reviewPeriod }}</td>
            </tr>
            <tr>
                <td class="label">Line Manager</td>
                <td>{{ $appraisal->lineManager?->name ?? 'Not specified' }}</td>
                <td class="label">Approving Manager</td>
                <td>{{ $appraisal->approvingManager?->name ?? 'Not specified' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Score Summary</h2>
        <table class="stat-band">
            <tr>
                <td>
                    <div class="num">{{ $scoreSummary['business'] ?? '—' }}</div>
                    <div class="lbl">Business</div>
                </td>
                <td>
                    <div class="num">{{ $scoreSummary['values'] ?? '—' }}</div>
                    <div class="lbl">Values</div>
                </td>
                <td>
                    <div class="num">{{ $scoreSummary['overall'] ?? '—' }}</div>
                    <div class="lbl">Overall</div>
                </td>
                <td>
                    <div class="num" style="font-size:12px;">{{ $scoreSummary['rating'] ?? 'Unrated' }}</div>
                    <div class="lbl">Final Rating</div>
                </td>
            </tr>
        </table>
        <p class="muted" style="margin-top:8px;">
            Scorecard: {{ $scoreSummary['weights'] ?? '—' }}
        </p>
        <p style="margin-top:8px; font-size:11px; line-height:1.5;">
            {{ $scoreSummary['comment'] ?? '' }}
        </p>
    </div>

    <div class="section">
        <h2>Business Objectives</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:9%;">Perspective</th>
                    <th style="width:14%;">Objective (The Goal)</th>
                    <th style="width:12%;">KPI / Measure (How Measured)</th>
                    <th style="width:12%;">Target (Success Definition)</th>
                    <th style="width:6%;">Weight</th>
                    <th style="width:11%;">Evidence Source</th>
                    <th style="width:14%;">Performance Achieved</th>
                    <th style="width:11%;">Self Rating</th>
                    <th style="width:11%;">Manager&rsquo;s Rating</th>
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
    </div>

    <div class="section">
        <h2>Other Substantial Achievements</h2>
        <div class="comment-box">
            @forelse ($achievementComments as $comment)
                <p>{{ $comment->body }}</p>
            @empty
                <p class="muted">No achievement comments captured.</p>
            @endforelse
        </div>
    </div>

    <div class="section">
        <h2>Significant Issues</h2>
        <div class="comment-box">
            @forelse ($issueComments as $comment)
                <p>{{ $comment->body }}</p>
            @empty
                <p class="muted">No significant issues captured.</p>
            @endforelse
        </div>
    </div>

    <div class="section">
        <h2>Comments</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Individual Comments</th>
                    <th>Manager Comments</th>
                    <th>Approving Manager Comments</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="comment-box">
                        @forelse ($generalComments as $comment)
                            <p>{{ $comment->body }}</p>
                        @empty
                            <span class="muted">No individual comments captured.</span>
                        @endforelse
                    </td>
                    <td class="comment-box">
                        @php $managerComments = $appraisal->objectives->whereNotNull('manager_comment'); @endphp
                        @forelse ($managerComments as $objective)
                            <p>{{ $objective->manager_comment }}</p>
                        @empty
                            <span class="muted">No manager comments captured.</span>
                        @endforelse
                    </td>
                    <td class="comment-box">
                        <span class="muted">Not captured.</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Sign-off</h2>
        <table class="kv-table">
            <tr>
                <td class="label">Employee</td>
                <td></td>
                <td class="label">Date</td>
                <td></td>
            </tr>
            <tr>
                <td class="label">Manager</td>
                <td></td>
                <td class="label">Date</td>
                <td></td>
            </tr>
            <tr>
                <td class="label">Approving Manager</td>
                <td></td>
                <td class="label">Date</td>
                <td></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Business Objectives Rating Scale</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:10%;">Rating</th>
                    <th>Description</th>
                    <th style="width:14%;">Range</th>
                </tr>
            </thead>
            <tbody>
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
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Values Objectives Rating Scale</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:10%;">Rating</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
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
            </tbody>
        </table>
    </div>
@endsection
