import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Bắt buộc để đính kèm HttpOnly Cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiResponse<any>>) => {
        const resData = error.response?.data;
        const status = error.response?.status;

        // Lấy thông điệp lỗi trực tiếp từ ApiResponse của Backend
        const errorMessage = resData?.message || 'An unexpected error occurred. Please try again.';

        // Tự động bắn Toast ngoại trừ lỗi 401 (xác thực silent lúc boot app)
        if (status !== 401 && globalShowToast) {
            globalShowToast(errorMessage, 'error');
        }

        return Promise.reject(resData || {
            success: false,
            message: errorMessage,
            timestamp: new Date().toISOString()
        });
    }
);