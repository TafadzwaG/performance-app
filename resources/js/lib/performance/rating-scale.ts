export interface OverallRatingOption {
    value: number | string;
    label: string;
    min_percent?: number | null;
    max_percent?: number | null;
    value_score?: number | string | null;
}

export function resolveOverallRatingLevelId(
    options: OverallRatingOption[],
    score: number,
): string | null {
    if (!options.length || Number.isNaN(score)) {
        return null;
    }

    const match = options.find(
        (level) =>
            level.min_percent !== null &&
            level.min_percent !== undefined &&
            level.max_percent !== null &&
            level.max_percent !== undefined &&
            score >= Number(level.min_percent) &&
            score <= Number(level.max_percent),
    );

    if (match) {
        return String(match.value);
    }

    const last = options[options.length - 1];

    return last ? String(last.value) : null;
}
