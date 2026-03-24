<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #111827;
            font-size: 12px;
            line-height: 1.6;
            margin: 24px 28px;
        }

        .eyebrow {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #6b7280;
            margin-bottom: 10px;
        }

        h1 {
            font-size: 24px;
            margin: 0 0 6px 0;
        }

        .subtitle {
            font-size: 13px;
            color: #4b5563;
            margin-bottom: 20px;
        }

        .summary {
            border: 1px solid #d1d5db;
            border-radius: 10px;
            padding: 12px 14px;
            background: #f9fafb;
            margin-bottom: 20px;
        }

        h2 {
            font-size: 16px;
            margin: 22px 0 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
        }

        h3 {
            font-size: 13px;
            margin: 16px 0 6px;
        }

        p, li {
            color: #1f2937;
        }

        ul, ol {
            padding-left: 18px;
        }

        code {
            background: #f3f4f6;
            padding: 1px 4px;
            border-radius: 4px;
            font-size: 11px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 16px;
        }

        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: #f3f4f6;
        }

        blockquote {
            border-left: 3px solid #9ca3af;
            padding-left: 12px;
            color: #4b5563;
            margin-left: 0;
        }
    </style>
</head>
<body>
    <div class="eyebrow">Performance Appraisal System Documentation</div>
    <h1>{{ $title }}</h1>
    <div class="subtitle">{{ $description }}</div>

    <div class="summary">
        <strong>Audience:</strong> {{ $audience }}
    </div>

    {!! $html !!}
</body>
</html>
