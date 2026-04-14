import { useMemo, useState } from 'react';

export type Palette = {
    moss: string;
    cloud: string;
    mist: string;
    coal: string;
};

const PALETTE_KEY = 'app:palette';

export const DEFAULT_PALETTE: Palette = {
    moss: '#385144',
    cloud: '#F8F5F2',
    mist: '#C2D8C4',
    coal: '#222222',
};

function normalizeHex(value: string) {
    const raw = value.trim().toUpperCase();
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#[0-9A-F]{6}$/.test(withHash) ? withHash : null;
}

function sanitizePalette(input: Partial<Palette> | null | undefined): Palette {
    return {
        moss: normalizeHex(input?.moss ?? '') ?? DEFAULT_PALETTE.moss,
        cloud: normalizeHex(input?.cloud ?? '') ?? DEFAULT_PALETTE.cloud,
        mist: normalizeHex(input?.mist ?? '') ?? DEFAULT_PALETTE.mist,
        coal: normalizeHex(input?.coal ?? '') ?? DEFAULT_PALETTE.coal,
    };
}

export function applyPalette(palette: Palette) {
    const root = document.documentElement;
    root.style.setProperty('--palette-moss', palette.moss);
    root.style.setProperty('--palette-cloud', palette.cloud);
    root.style.setProperty('--palette-mist', palette.mist);
    root.style.setProperty('--palette-coal', palette.coal);
}

function readStoredPalette(): Palette {
    try {
        const raw = localStorage.getItem(PALETTE_KEY);
        if (!raw) return DEFAULT_PALETTE;
        return sanitizePalette(JSON.parse(raw) as Partial<Palette>);
    } catch {
        return DEFAULT_PALETTE;
    }
}

export function initializePalette() {
    applyPalette(readStoredPalette());
}

export function usePalette() {
    const [palette, setPalette] = useState<Palette>(() => readStoredPalette());

    const updateColor = (key: keyof Palette, value: string) => {
        const normalized = normalizeHex(value);
        if (!normalized) return;
        const next = { ...palette, [key]: normalized };
        setPalette(next);
        localStorage.setItem(PALETTE_KEY, JSON.stringify(next));
        applyPalette(next);
    };

    const resetPalette = () => {
        setPalette(DEFAULT_PALETTE);
        localStorage.setItem(PALETTE_KEY, JSON.stringify(DEFAULT_PALETTE));
        applyPalette(DEFAULT_PALETTE);
    };

    const previewColors = useMemo(
        () => [palette.moss, palette.cloud, palette.mist, palette.coal],
        [palette],
    );

    return { palette, updateColor, resetPalette, previewColors };
}
