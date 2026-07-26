@php
    $headerReportLabel = $reportTitle;
@endphp
@extends('pdf.layouts.studio-export')

@section('title', $reportTitle)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Platform Report</div>
        <div class="title">{{ $reportTitle }}</div>
        <div class="meta">
            Cross-tenant organization memberships with access and activation details.
            {{ $totalRows }} membership{{ $totalRows === 1 ? '' : 's' }} exported.
        </div>
    </div>

    <div class="section filters">
        <h2>Export Filters</h2>
        <table>
            @php
                $status = $filters['status'] ?? 'all';
                $filterRows = [
                    ['Search', filled($filters['search'] ?? null) ? $filters['search'] : 'All users and organizations'],
                    ['Membership Status', $status === 'all' ? 'All statuses' : \Illuminate\Support\Str::title($status)],
                    ['Organization', filled($filters['organization_name'] ?? null) ? $filters['organization_name'] : 'All organizations'],
                ];
            @endphp
            @foreach ($filterRows as [$label, $value])
                <tr>
                    <td class="label">{{ $label }}</td>
                    <td>{{ $value }}</td>
                </tr>
            @endforeach
        </table>
    </div>

    <div class="section summary">
        <h2>Summary</h2>
        <table class="summary-grid">
            <tr>
                <td>
                    <div class="value">{{ $summary['total'] }}</div>
                    <div class="label">Total Memberships</div>
                </td>
                <td>
                    <div class="value">{{ $summary['active'] }}</div>
                    <div class="label">Active Memberships</div>
                </td>
                <td>
                    <div class="value">{{ $summary['default'] }}</div>
                    <div class="label">Default Memberships</div>
                </td>
                <td>
                    <div class="value">{{ $summary['allLocations'] }}</div>
                    <div class="label">All Locations Access</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>{{ $reportTitle }}</h2>
        <table class="data-table">
            <thead>
                <tr>
                    @foreach ($headings as $heading)
                        <th>{{ $heading }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($tableRows as $row)
                    <tr>
                        @foreach ($row as $value)
                            <td>{{ $value }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
@endsection
