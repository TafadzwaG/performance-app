@php
    $headerReportLabel = $reportTitle;
@endphp
@extends('pdf.layouts.studio-export')

@section('title', $reportTitle)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Performance Report</div>
        <div class="title">{{ $reportTitle }}</div>
        <div class="meta">
            {{ $reportDescription }}
            {{ $totalRows }} record{{ $totalRows === 1 ? '' : 's' }} exported.
        </div>
    </div>

    <div class="section filters">
        <h2>Export Filters</h2>
        <table>
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
                    <div class="value">{{ $totalRows }}</div>
                    <div class="label">Total Records</div>
                </td>
                <td>
                    <div class="value">{{ count($headings) }}</div>
                    <div class="label">Columns</div>
                </td>
                <td>
                    <div class="value">{{ $filterRows[0][1] ?? 'All cycles' }}</div>
                    <div class="label">Review Cycle</div>
                </td>
                <td>
                    <div class="value">{{ $exportedAt->format('d M Y') }}</div>
                    <div class="label">Export Date</div>
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
