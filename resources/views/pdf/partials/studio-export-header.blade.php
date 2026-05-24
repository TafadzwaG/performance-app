@php
    $logoDataUri = $logoDataUri ?? ($branding['logoDataUri'] ?? null);
    $logoUrl = $logoUrl ?? ($branding['logoUrl'] ?? null);
    $logoExists = $logoExists ?? ($branding['logoExists'] ?? filled($logoDataUri) || filled($logoUrl));
    $companyName = $companyName ?? ($branding['companyName'] ?? 'Performance Appraisal Studio');
    $companyAddress = $companyAddress ?? ($branding['companyAddress'] ?? null);
    $logoSrc = ($previewHtml ?? false)
        ? ($logoUrl ?? $logoDataUri)
        : ($logoDataUri ?? $logoUrl);
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
                <div class="export-label">§ {{ strtoupper($headerReportLabel ?? $reportTitle ?? 'Export') }}</div>
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
