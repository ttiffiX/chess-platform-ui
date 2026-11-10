export const parseWebSocketError = (
    body: string,
): string | null => {
    try {
        const data: unknown = JSON.parse(body);

        if (
            typeof data !== 'object' ||
            data === null ||
            Array.isArray(data)
        ) {
            return null;
        }

        const response = data as Record<string, unknown>;

        if (
            response.success !== false ||
            typeof response.message !== 'string'
        ) {
            return null;
        }

        return response.message;
    } catch {
        return null;
    }
};