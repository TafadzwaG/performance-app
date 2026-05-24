@php
    $headerReportLabel = 'Documentation';
@endphp
@extends('pdf.layouts.studio-export')

@section('title', $title)

@section('content')
    <div class="title-block">
        <div class="eyebrow">Help &amp; Documentation</div>
        <div class="title">{{ $title }}</div>
        <div class="meta">{{ $description }}</div>
    </div>

    <div class="section">
        <div class="summary-panel">
            <strong>Audience:</strong> {{ $audience }}
        </div>
    </div>

    <div class="section prose">
        {!! $html !!}
    </div>
@endsection
