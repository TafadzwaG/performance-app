import { useMemo, useState } from 'react';

export type Palette = {
    sand: string;
    ink: string;
    cream: string;
    pine: string;
};

const PALETTE_KEY = 'app:palette';

export const DEFAULT_PALETTE: Palette = {
    sand: '#BFB48F',
    ink: '#252627',
    cream: '#F6F1E6',
    pine: '#2F4A3F',
};

function normalizeHex(value: string) {
    const raw = value.trim().toUpperCase();
    const withHash = raw.startsWith('#') ? raw : `#${raw}`;
    return /^#[0-9A-F]{6}$/.test(withHash) ? withHash : null;
}

function sanitizePalette(input: Partial<Palette> | null | undefined): Palette {
    return {
        sand: normalizeHex(input?.sand ?? '') ?? DEFAULT_PALETTE.sand,
        ink: normalizeHex(input?.ink ?? '') ?? DEFAULT_PALETTE.ink,
        cream: normalizeHex(input?.cream ?? '') ?? DEFAULT_PALETTE.cream,
        pine: normalizeHex(input?.pine ?? '') ?? DEFAULT_PALETTE.pine,
    };
}

export function applyPalette(palette: Palette) {
    const root = document.documentElement;
    root.style.setProperty('--palette-sand', palette.sand);
    root.style.setProperty('--palette-ink', palette.ink);
    root.style.setProperty('--palette-cream', palette.cream);
    root.style.setProperty('--palette-pine', palette.pine);
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
        () => [palette.sand, palette.ink, palette.cream, palette.pine],
        [palette],
    );

    return { palette, updateColor, resetPalette, previewColors };
}
