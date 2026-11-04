import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';

import type {AuthContextType, AuthResponse} from '../types/auth';
import type {UserInfo} from '../../../types/user';
import type {ApiResponse} from '../../../types/api';
import {
    client,
    setApiAccessToken,
} from '../../../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_INFO_KEY = 'user_info';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const [user, setUser] = useState<UserInfo | null>(() => {
        const saved = localStorage.getItem(USER_INFO_KEY);

        if (!saved) return null;

        try {
            return JSON.parse(saved) as UserInfo;
        } catch {
            localStorage.removeItem(USER_INFO_KEY);
            return null;
        }
    });

    const [isLoading, setIsLoading] = useState(true);

    const loginSuccess = useCallback((data: AuthResponse) => {
        setAccessToken(data.accessToken);
        setApiAccessToken(data.accessToken);
        setUser(data.userInfo);
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.userInfo));
    }, []);

    const clearAuth = useCallback(() => {
        setAccessToken(null);
        setApiAccessToken(null);
        setUser(null);
        localStorage.removeItem(USER_INFO_KEY);
    }, []);

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