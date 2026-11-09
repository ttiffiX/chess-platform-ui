import axios, {
    type AxiosError,
    type InternalAxiosRequestConfig,
} from 'axios';

import {API_BASE_URL} from '../config/env';
import {globalShowToast} from '../context/ToastContext';
import type {ApiResponse} from '../types/api';

let currentAccessToken: string | null = null;

type TokenRefreshHandler = () => Promise<string | null>;

let tokenRefreshHandler: TokenRefreshHandler | null = null;
let refreshPromise: Promise<string | null> | null = null;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _authRetried?: boolean;
}

const REFRESH_BUFFER_MS = 60_000;

export const setApiAccessToken = (token: string | null): void => {
    currentAccessToken = token;
};

export const getApiAccessToken = (): string | null => {
    return currentAccessToken;
};

// Axios client chính dành cho các API cần access token.
export const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Client riêng cho các request xác thực dựa trên cookie.
// Không sử dụng request/response interceptors của client chính.
export const authClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setTokenRefreshHandler = (
    handler: TokenRefreshHandler | null,
): void => {
    tokenRefreshHandler = handler;
};

// Chỉ cho phép một refresh request chạy tại một thời điểm.
export const refreshAccessToken = (): Promise<string | null> => {
    if (!tokenRefreshHandler) {
        return Promise.resolve(null);
    }

    if (!refreshPromise) {
        const handler = tokenRefreshHandler;

        refreshPromise = Promise.resolve()
            .then(() => handler())
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

// Đọc expiration claim từ JWT.
// Đây chỉ là kiểm tra thời điểm hết hạn ở phía client,
// không thay thế việc Backend xác thực token.
export const getAccessTokenExpirationMs = (
    token: string,
): number | null => {
    try {
        const payload = token.split('.')[1];

        if (!payload) {
            return null;
        }

        const normalizedPayload = payload
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const paddedPayload = normalizedPayload.padEnd(
            Math.ceil(normalizedPayload.length / 4) * 4,
            '=',
        );

        const claims: unknown = JSON.parse(
            window.atob(paddedPayload),
        );

        if (
            typeof claims !== 'object' ||
            claims === null ||
            !('exp' in claims) ||
            typeof claims.exp !== 'number'
        ) {
            return null;
        }

        return claims.exp * 1000;
    } catch {
        return null;
    }
};

// Lấy token đủ mới trước khi STOMP CONNECT/reconnect.
export const getFreshAccessToken = async (): Promise<string | null> => {
    const token = currentAccessToken;

    if (!token) {
        return null;
    }

    const expiresAt = getAccessTokenExpirationMs(token);

    // Nếu không đọc được exp, dùng token hiện tại và để Backend xác thực.
    if (expiresAt === null) {
        return token;
    }

    // Token vẫn còn đủ thời gian sử dụng.
    if (expiresAt - Date.now() > REFRESH_BUFFER_MS) {
        return token;
    }

    // Token sắp hết hạn hoặc đã hết hạn: refresh qua cơ chế chung.
    return refreshAccessToken();
};

const isCookieAuthEndpoint = (url?: string): boolean => {
    const path = url?.split('?')[0] ?? '';

    return (
        path.endsWith('/auth/refresh') ||
        path.endsWith('/auth/logout')
    );
};

// Đính kèm access token cho REST request cần xác thực.
client.interceptors.request.use((config) => {
    if (isCookieAuthEndpoint(config.url)) {
        config.headers.delete('Authorization');
    } else if (currentAccessToken) {
        config.headers.set(
            'Authorization',
            `Bearer ${currentAccessToken}`,
        );
    } else {
        config.headers.delete('Authorization');
    }

    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
        const resData = error.response?.data;
        const status = error.response?.status;

        const originalRequest =
            error.config as RetryableRequestConfig | undefined;

        const errorMessage =
            resData?.message ||
            'An unexpected error occurred. Please try again.';

        const isAuthRequest = isCookieAuthEndpoint(
            originalRequest?.url,
        );

        const wasAlreadyRetried =
            originalRequest?._authRetried === true;

        // Chỉ tự refresh cho REST request thông thường nhận 401.
        if (
            status === 401 &&
            originalRequest &&
            !wasAlreadyRetried &&
            !isAuthRequest
        ) {
            originalRequest._authRetried = true;

            const requestAuthorization =
                originalRequest.headers.get('Authorization');

            const latestAuthorization = currentAccessToken
                ? `Bearer ${currentAccessToken}`
                : null;

            try {
                let newAccessToken: string | null;

                // Một request khác có thể đã refresh xong trong lúc
                // request này đang chờ response 401.
                if (
                    latestAuthorization &&
                    requestAuthorization !== latestAuthorization
                ) {
                    newAccessToken = currentAccessToken;
                } else {
                    newAccessToken = await refreshAccessToken();
                }

                if (newAccessToken) {
                    originalRequest.headers.set(
                        'Authorization',
                        `Bearer ${newAccessToken}`,
                    );

                    // Retry đúng một lần.
                    return client.request(originalRequest);
                }
            } catch {
                globalShowToast?.(
                    'Unable to renew your session. Please try again.',
                    'error',
                );

                return Promise.reject(
                    resData ?? {
                        success: false,
                        message: errorMessage,
                        timestamp: new Date().toISOString(),
                    },
                );
            }
        }

        // Không toast lỗi 401 của /auth/refresh hoặc /auth/logout.
        // Nếu request retry vẫn 401 thì hiển thị lỗi cho người dùng.
        if (
            status !== 401 ||
            wasAlreadyRetried
        ) {
            globalShowToast?.(errorMessage, 'error');
        }

        return Promise.reject(
            resData ?? {
                success: false,
                message: errorMessage,
                timestamp: new Date().toISOString(),
            },
        );
    },
);