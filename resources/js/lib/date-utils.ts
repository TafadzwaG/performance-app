import moment from 'moment';

export function formatDate(
    value?: string | null,
    fallback = 'Not set',
    outputFormat = 'MMM D, YYYY',
) {
    if (!value) {
        return fallback;
    }

    const parsed = moment(value);
    return parsed.isValid() ? parsed.format(outputFormat) : fallback;
}

export function formatDateTime(
    value?: string | null,
    fallback = 'Not set',
    outputFormat = 'MMM D, YYYY h:mm A',
) {
    if (!value) {
        return fallback;
    }

    const parsed = moment(value);
    return parsed.isValid() ? parsed.format(outputFormat) : fallback;
}

export function toDateInputValue(value?: string | null) {
    if (!value) {
        return '';
    }

    const parsed = moment(value);
    if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DD');
    }

    return value;
}
