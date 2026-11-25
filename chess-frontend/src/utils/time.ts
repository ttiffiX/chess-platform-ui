export const formatDateTime = (value: string): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown date';
    }

    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

export const formatTimeControl = (
    baseSeconds: number,
    incrementSeconds: number,
): string => {
    if (baseSeconds === 0) {
        return 'Unlimited';
    }

    const baseLabel = baseSeconds >= 60
        ? `${baseSeconds / 60} min`
        : `${baseSeconds}s`;

    return `${baseLabel} + ${incrementSeconds}s`;
};