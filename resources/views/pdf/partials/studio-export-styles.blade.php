<style>
    @page { margin: 24px 28px 72px 28px; }

    body {
        font-family: DejaVu Sans, sans-serif;
        color: #252627;
        font-size: 9px;
        line-height: 1.35;
    }

    h1, h2, h3 { margin: 0; }

    .header {
        border-bottom: 2px solid #BFB48F;
        padding-bottom: 10px;
        margin-bottom: 12px;
    }

    .header table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .header td { vertical-align: top; }
    .header .logo { width: 16%; }
    .header .logo img { max-width: 92px; max-height: 52px; }
    .header .company-cell { width: 52%; padding: 0 12px 0 6px; }
    .header .company { font-size: 14px; font-weight: bold; line-height: 1.25; }
    .header .address { color: #5F5A4A; font-size: 8.5px; margin-top: 2px; }
    .header .meta-cell { width: 32%; text-align: right; }
    .header .export-label {
        font-size: 8px;
        color: #8A8268;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
    }

    .header .export-by { color: #5F5A4A; font-size: 8.5px; }

    .eyebrow {
        font-size: 8px;
        color: #8A8268;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 3px;
    }

    .title-block { margin-bottom: 10px; }
    .title-block .title { font-size: 18px; font-weight: normal; }
    .title-block .meta { color: #5F5A4A; font-size: 9px; margin-top: 2px; }

    .section { margin-bottom: 10px; page-break-inside: avoid; }
    .section h2 {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #252627;
        background: #F3EEDD;
        padding: 5px 7px;
        margin-bottom: 6px;
    }

    .filters table,
    .summary table,
    .kv-table {
        width: 100%;
        border-collapse: collapse;
    }

    .filters td,
    .summary td,
    .kv-table td {
        padding: 3px 6px;
        border: 1px solid #BFB48F;
        vertical-align: top;
    }

    .filters td.label,
    .summary td.label,
    .kv-table td.label {
        width: 14%;
        font-weight: bold;
        background: #F3EEDD;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .summary-grid {
        width: 100%;
        border-collapse: collapse;
    }

    .summary-grid td {
        width: 25%;
        border: 1px solid #D9D2BC;
        padding: 8px;
        text-align: center;
        vertical-align: top;
    }

    .summary-grid .value {
        font-size: 16px;
        font-weight: bold;
        color: #252627;
        line-height: 1.1;
    }

    .summary-grid .label {
        font-size: 8px;
        color: #8A8268;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-top: 4px;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .data-table th,
    .data-table td {
        border: 1px solid #BFB48F;
        padding: 4px 5px;
        vertical-align: top;
        word-wrap: break-word;
    }

    .data-table th {
        background: #252627;
        color: #FFFFFF;
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: bold;
        text-align: left;
    }

    .comment-box {
        border: 1px solid #BFB48F;
        padding: 5px 7px;
        min-height: 24px;
    }

    .comment-box p { margin: 0 0 4px; }
    .comment-box p:last-child { margin-bottom: 0; }

    .muted { color: #5F5A4A; }

    .pill {
        display: inline-block;
        padding: 2px 6px;
        border: 1px solid #BFB48F;
        background: #F3EEDD;
        color: #252627;
        font-size: 8px;
        font-weight: bold;
        letter-spacing: 0.04em;
    }

    .stat-band {
        width: 100%;
        border-collapse: collapse;
        background: #252627;
        color: #ffffff;
    }

    .stat-band td {
        text-align: center;
        padding: 8px 10px;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
        vertical-align: middle;
    }

    .stat-band tr td:last-child { border-right: 0; }

    .stat-band .num {
        font-size: 16px;
        color: #BFB48F;
        font-weight: bold;
        line-height: 1.1;
    }

    .stat-band .lbl {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 4px;
    }

    .prose h2 {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #252627;
        background: #F3EEDD;
        padding: 5px 7px;
        margin: 12px 0 6px;
    }

    .prose h3 {
        font-size: 9.5px;
        color: #252627;
        margin: 10px 0 4px;
    }

    .prose p,
    .prose li {
        color: #252627;
        font-size: 9px;
    }

    .prose ul,
    .prose ol {
        padding-left: 16px;
        margin: 4px 0 8px;
    }

    .prose code {
        background: #F3EEDD;
        padding: 1px 4px;
        font-size: 8.5px;
    }

    .prose table {
        width: 100%;
        border-collapse: collapse;
        margin: 6px 0 10px;
    }

    .prose th,
    .prose td {
        border: 1px solid #BFB48F;
        padding: 4px 5px;
        vertical-align: top;
        font-size: 8.5px;
    }

    .prose th {
        background: #252627;
        color: #FFFFFF;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .prose blockquote {
        border-left: 3px solid #BFB48F;
        padding-left: 10px;
        color: #5F5A4A;
        margin: 6px 0;
    }

    .summary-panel {
        border: 1px solid #BFB48F;
        background: #F3EEDD;
        padding: 6px 8px;
        margin-bottom: 10px;
    }

    .footer {
        position: fixed;
        left: 28px;
        right: 28px;
        bottom: 18px;
        border-top: 1px solid #D9D2BC;
        padding-top: 6px;
        font-size: 8px;
        color: #8A8268;
    }

    .footer-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .footer-table td { vertical-align: middle; }

    .footer-table .footer-main {
        width: 70%;
        line-height: 1.35;
        padding-right: 10px;
    }

    .footer-table .footer-powered {
        width: 30%;
        text-align: right;
        white-space: nowrap;
    }

    .powered-by .label {
        font-size: 7px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #8A8268;
        margin-right: 4px;
    }

    .powered-by img {
        height: 16px;
        vertical-align: middle;
    }
</style>
