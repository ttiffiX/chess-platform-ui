// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthContextType, AuthResponse, UserInfo } from '../types/auth';
import type { ApiResponse } from '../types/api';
import { client } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_INFO_KEY = 'user_info';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Access Token chỉ lưu trong State (RAM)
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // Thông tin cơ bản lưu ở localStorage
    const [user, setUser] = useState<UserInfo | null>(() => {
        const saved = localStorage.getItem(USER_INFO_KEY);
        return saved ? JSON.parse(saved) : null;
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loginSuccess = useCallback((data: AuthResponse) => {
        setAccessToken(data.accessToken);
        setUser(data.userInfo);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.userInfo));
    }, []);

    const clearAuth = useCallback(() => {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem(USER_INFO_KEY);
    }, []);

    // Gọi API /api/auth/refresh để lấy ACT thông qua HttpOnly Cookie chứa RFT
    const checkAuthOnBoot = useCallback(async (): Promise<boolean> => {
        try {
            const response = await client.post<ApiResponse<AuthResponse>>('/auth/refresh');
            if (response.data?.success && response.data?.data) {
                loginSuccess(response.data.data);
                return true;
            }
            clearAuth();
            return false;
        } catch {
            clearAuth();
            return false;
        }
    }, [loginSuccess, clearAuth]);

    useEffect(() => {
        const init = async () => {
            await checkAuthOnBoot();
            setIsLoading(false);
        };
        init();
    }, [checkAuthOnBoot]);

    const logout = async () => {
        try {
            await client.post('/auth/logout');
        } catch {
            // Bỏ qua lỗi mạng khi logout
        } finally {
            clearAuth();
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                user,
                isAuthenticated: !!accessToken,
                isLoading,
                loginSuccess,
                logout,
                checkAuthOnBoot,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};