@php
    $headerReportLabel = $reportTitle;
@endphp
@extends('pdf.layouts.studio-export')

@section('title', $reportTitle)

@section('content')
    <div class="title-block">
        <div class="eyebrow">IT Report</div>
        <div class="title">{{ $reportTitle }}</div>
        <div class="meta">
            Application user accounts with assigned roles and direct permissions.
            {{ $totalRows }} user{{ $totalRows === 1 ? '' : 's' }} exported.
        </div>
    </div>

    <div class="section filters">
        <h2>Export Filters</h2>
        <table>
            @php
                $approvalStatus = $filters['approval_status'] ?? 'active';
                $filterRows = [
                    ['Search', filled($filters['search'] ?? null) ? $filters['search'] : 'All users'],
                    ['Approval Status', $approvalStatus === 'pending' ? 'Pending approvals' : 'Active users'],
                    ['Role', $filters['role'] ?? 'All roles'],
                    ['Department', $filters['department'] ?? 'All departments'],
                    ['Employee Profile', $filters['employee_link'] ?? 'All profile states'],
                    ['Direct Permissions', $filters['has_direct_permissions'] ?? 'All permission states'],
                    ['Sort By', \Illuminate\Support\Str::of($filters['sort_by'] ?? 'name')->replace('_', ' ')->title()],
                    ['Sort Direction', strtoupper($filters['sort_dir'] ?? 'asc')],
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
                    <div class="label">Total Users</div>
                </td>
                <td>
                    <div class="value">{{ $summary['approvalScope'] }}</div>
                    <div class="label">Scope</div>
                </td>
                <td>
                    <div class="value">{{ $summary['withRoles'] }}</div>
                    <div class="label">Users With Roles</div>
                </td>
                <td>
                    <div class="value">{{ $summary['withDirectPermissions'] }}</div>
                    <div class="label">Users With Direct Permissions</div>
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
