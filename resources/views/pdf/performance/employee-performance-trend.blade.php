@php
    use App\Support\Performance\ScoreFormatter;

    $employeeName = $employeeProfile->user?->name ?? $employeeProfile->employee_number;
    $headerReportLabel = 'Employee Performance Trend';
@endphp
@extends('pdf.layouts.studio-export')

@section('title', 'Employee Performance Trend — '.$employeeName)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Performance Analytics</div>
        <div class="title">Employee Performance Trend</div>
        <div class="meta">
            {{ $employeeName }}
            · {{ $employeeProfile->employee_number }}
            · {{ $employeeProfile->jobTitle?->name ?? 'No job title' }}
        </div>
    </div>

    <div class="section">
        <h2>Employee Details</h2>
        <table class="kv-table">
            <tr>
                <td class="label">Employee Name</td>
                <td>{{ $employeeName }}</td>
                <td class="label">Employee Number</td>
                <td>{{ $employeeProfile->employee_number }}</td>
            </tr>
            <tr>
                <td class="label">Department</td>
                <td>{{ $employeeProfile->department?->name ?? 'Not specified' }}</td>
                <td class="label">Job Title</td>
                <td>{{ $employeeProfile->jobTitle?->name ?? 'Not specified' }}</td>
            </tr>
            <tr>
                <td class="label">Line Manager</td>
                <td>{{ $employeeProfile->lineManager?->name ?? 'Not assigned' }}</td>
                <td class="label">Trend Status</td>
                <td>{{ $trendStatusLabel }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Performance Summary</h2>
        <table class="stat-band">
            <tr>
                <td>
                    <div class="num">
                        {{ $performanceTrend['previous_score'] !== null ? ScoreFormatter::formatPercent($performanceTrend['previous_score']) : '—' }}
                    </div>
                    <div class="lbl">Previous Cycle</div>
                </td>
                <td>
                    <div class="num">
                        {{ $performanceTrend['latest_score'] !== null ? ScoreFormatter::formatPercent($performanceTrend['latest_score']) : '—' }}
                    </div>
                    <div class="lbl">Current Cycle</div>
                </td>
                <td>
                    <div class="num">
                        @if ($performanceTrend['score_delta'] !== null)
                            {{ $performanceTrend['score_delta'] > 0 ? '+' : '' }}{{ number_format((float) $performanceTrend['score_delta'], 1) }}
                        @else
                            —
                        @endif
                    </div>
                    <div class="lbl">Delta</div>
                </td>
                <td>
                    <div class="num" style="font-size:12px;">{{ $trendStatusLabel }}</div>
                    <div class="lbl">Trend</div>
                </td>
            </tr>
        </table>
        @if ($performanceTrend['previous_cycle_name'] && $performanceTrend['current_cycle_name'])
            <p class="muted" style="margin-top:8px;">
                {{ $performanceTrend['previous_cycle_name'] }} → {{ $performanceTrend['current_cycle_name'] }}
            </p>
        @endif
    </div>

    <div class="section">
        <h2>Performance by Cycle</h2>
        <div style="margin-top:4px;">
            {!! $chartSvg !!}
        </div>
    </div>

    <div class="section">
        <h2>Cycle Scores</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:55%;">Review Cycle</th>
                    <th style="width:25%;">Effective Score</th>
                    <th style="width:20%;">Finalized</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($performanceTrend['points'] as $point)
                    <tr>
                        <td>{{ $point['cycle_name'] }}</td>
                        <td>{{ ScoreFormatter::formatPercent($point['score']) }}</td>
                        <td>
                            @if ($point['finalized_at'])
                                {{ \Illuminate\Support\Carbon::parse($point['finalized_at'])->format('d M Y') }}
                            @else
                                —
                            @endif
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    @if ($peerComparison)
        <div class="section">
            <h2>Same Scorecard Peers</h2>
            <p class="muted" style="margin-bottom:6px;">
                {{ $peerComparison['template_name'] }}
                · Rank {{ $peerComparison['cohort_rank'] }} of {{ $peerComparison['cohort_size'] }}
                · Cohort average {{ number_format((float) $peerComparison['cohort_average'], 1) }}%
            </p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Job Title</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach (array_slice($peerComparison['peers'], 0, 8) as $peer)
                        <tr>
                            <td>{{ $peer['employee_name'] }}</td>
                            <td>{{ $peer['job_title'] ?? '—' }}</td>
                            <td>{{ ScoreFormatter::formatPercent($peer['current_score']) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
@endsection
