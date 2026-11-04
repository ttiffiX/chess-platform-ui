import axios, {type AxiosError} from 'axios';

import {API_BASE_URL} from '../config/env';
import {globalShowToast} from '../context/ToastContext';
import type {ApiResponse} from '../types/api';

let currentAccessToken: string | null = null;

export const setApiAccessToken = (token: string | null): void => {
    currentAccessToken = token;
};

export const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Đính kèm access token cho các REST request cần xác thực.
client.interceptors.request.use((config) => {
    if (currentAccessToken) {
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
    (error: AxiosError<ApiResponse<unknown>>) => {
        const resData = error.response?.data;
        const status = error.response?.status;

        const errorMessage =
            resData?.message ||
            'An unexpected error occurred. Please try again.';

        // Không hiển thị toast khi refresh authentication thất bại.
        if (status !== 401) {
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