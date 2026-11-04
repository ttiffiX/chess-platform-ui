import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from 'react';

import type {AuthContextType, AuthResponse} from '../types/auth';
import type {UserInfo} from '../../../types/user';
import type {ApiResponse} from '../../../types/api';

import {
    client,
    setApiAccessToken,
} from '../../../api/client';

interface AuthSession {
    accessToken: string;
    user: UserInfo;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children,}) => {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Đảm bảo bootstrap chỉ chạy một lần, kể cả React StrictMode.
    const bootstrapStartedRef = useRef(false);

    const clearSession = useCallback(() => {
        setApiAccessToken(null);
        setSession(null);
    }, []);

    // Khôi phục session khi ứng dụng khởi động.
    useEffect(() => {
        if (bootstrapStartedRef.current) {
            return;
        }

        bootstrapStartedRef.current = true;

        const restoreSession = async () => {
            try {
                const response = await client.post<ApiResponse<AuthResponse>>(
                    '/auth/refresh',
                );

                const authData = response.data?.data;

                if (
                    !response.data?.success ||
                    !authData?.accessToken ||
                    !authData?.userInfo
                ) {
                    clearSession();
                    return;
                }

                setApiAccessToken(authData.accessToken);

                setSession({
                    accessToken: authData.accessToken,
                    user: authData.userInfo,
                });
            } catch {
                clearSession();
            } finally {
                setIsLoading(false);
            }
        };

        void restoreSession();
    }, [clearSession]);

    const logout = useCallback(async () => {
        try {
            await client.post('/auth/logout');
        } catch {
            // Vẫn phải xóa session phía frontend nếu request thất bại.
        } finally {
            clearSession();
            window.location.replace('/login');
        }
    }, [clearSession]);

    const value: AuthContextType = {
        accessToken: session?.accessToken ?? null,
        user: session?.user ?? null,
        isAuthenticated: session !== null,
        isLoading,
        logout,
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};