@php
    use App\Support\Branding;

    $brandingContext = $branding ?? [];
    $logoPath = $logoPath ?? ($brandingContext['logoPath'] ?? null);
    $logoDataUri = $logoDataUri ?? ($brandingContext['logoDataUri'] ?? null);
    $logoPdfSrc = $logoPdfSrc ?? ($brandingContext['logoPdfSrc'] ?? null);
    $logoUrl = $logoUrl ?? ($brandingContext['logoUrl'] ?? null);
    $logoExists = $logoExists ?? ($brandingContext['logoExists'] ?? false);
    $companyName = $companyName ?? ($brandingContext['companyName'] ?? 'Performance Appraisal Studio');
    $companyAddress = $companyAddress ?? ($brandingContext['companyAddress'] ?? null);

    if (! filled($logoPdfSrc) && filled($logoPath)) {
        $logoPdfSrc = Branding::pdfImageSrc($logoPath);
    }

    if (! filled($logoDataUri) && filled($logoPath)) {
        $logoDataUri = Branding::imageDataUriForPath($logoPath);
    }

    $logoExists = $logoExists || filled($logoPdfSrc) || filled($logoDataUri) || filled($logoUrl);

    $logoSrc = ($previewHtml ?? false)
        ? ($logoUrl ?? $logoDataUri ?? $logoPdfSrc)
        : ($logoPdfSrc ?? $logoDataUri ?? $logoUrl);
@endphp
<div class="header">
    <table>
        <tr>
            <td class="logo">
                @if ($logoExists && $logoSrc)
                    <img src="{{ $logoSrc }}" alt="Company logo">
                @endif
            </td>
            <td class="company-cell">
                <div class="company">{{ $companyName }}</div>
                @if ($companyAddress)
                    <div class="address">{{ $companyAddress }}</div>
                @endif
            </td>
            <td class="meta-cell">
                <div class="export-label">{{ strtoupper($headerReportLabel ?? $reportTitle ?? 'Export') }}</div>
                @if (isset($exportedBy) || isset($exportedAt))
                    <div class="export-by">
                        @if (isset($exportedBy))
                            Exported by {{ $exportedBy }}<br>
                        @endif
                        @if (isset($exportedByEmail))
                            {{ $exportedByEmail }}<br>
                        @endif
                        @if (isset($exportedAt))
                            {{ $exportedAt->format('d M Y H:i') }}
                        @endif
                    </div>
                @endif
            </td>
        </tr>
    </table>
</div>
