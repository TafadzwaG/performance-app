function parseContentDispositionFilename(header: string | null): string | null {
    if (!header) {
        return null;
    }

    const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1].replace(/["']/g, ''));
    }

    const basicMatch = header.match(/filename="?([^";]+)"?/i);

    return basicMatch?.[1]?.trim() ?? null;
}

export async function downloadFileFromUrl(url: string, fallbackFilename: string): Promise<string> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        throw new Error('Download failed. Please try again.');
    }

    const blob = await response.blob();
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition')) ?? fallbackFilename;
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    return filename;
}
