import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from 'react';

import axios from 'axios';

import type {
    AuthContextType,
    AuthResponse,
} from '../types/auth';

import type {UserInfo} from '../../../types/user';
import type {ApiResponse} from '../../../types/api';

import {
    authClient,
    client,
    getAccessTokenExpirationMs,
    refreshAccessToken,
    setApiAccessToken,
    setTokenRefreshHandler,
} from '../../../api/client';

interface AuthSession {
    accessToken: string;
    user: UserInfo;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const redirectToLogin = (): void => {
    if (window.location.pathname !== '/login') {
        window.location.replace('/login');
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                          children,
                                                                      }) => {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Đảm bảo bootstrap chỉ chạy một lần, kể cả React StrictMode.
    const bootstrapStartedRef = useRef(false);

    const clearSession = useCallback(() => {
        setApiAccessToken(null);
        setSession(null);
    }, []);

    // Thực hiện refresh token.
    // redirectOnFailure=false được dùng khi ứng dụng mới khởi động.
    const performRefresh = useCallback(async (
        redirectOnFailure: boolean,
    ): Promise<string | null> => {
        try {
            const response = await authClient.post<ApiResponse<AuthResponse>>(
                '/auth/refresh',
            );

            const authData = response.data?.data;

            if (
                !response.data?.success ||
                !authData?.accessToken ||
                !authData?.userInfo
            ) {
                clearSession();

                if (redirectOnFailure) {
                    redirectToLogin();
                }

                return null;
            }

            // Đồng bộ token cho Axios và React Context.
            setApiAccessToken(authData.accessToken);

            setSession({
                accessToken: authData.accessToken,
                user: authData.userInfo,
            });

            return authData.accessToken;
        } catch (error) {
            const status = axios.isAxiosError(error)
                ? error.response?.status
                : undefined;

            // Refresh token không còn hợp lệ hoặc đã hết hạn.
            if (
                status === 400 ||
                status === 401 ||
                status === 403
            ) {
                clearSession();

                if (redirectOnFailure) {
                    redirectToLogin();
                }

                return null;
            }

            // Lỗi mạng hoặc lỗi server tạm thời:
            // giữ session hiện tại để có thể thử refresh lại.
            throw error;
        }
    }, [clearSession]);

    // Callback này được Axios interceptor sử dụng khi REST nhận 401.
    const refreshSession = useCallback((): Promise<string | null> => {
        return performRefresh(true);
    }, [performRefresh]);

    // Đăng ký refresh handler dùng chung.
    useEffect(() => {
        setTokenRefreshHandler(refreshSession);

        return () => {
            setTokenRefreshHandler(null);
        };
    }, [refreshSession]);

    // Khôi phục session khi ứng dụng khởi động.
    useEffect(() => {
        if (bootstrapStartedRef.current) {
            return;
        }

        bootstrapStartedRef.current = true;

        const restoreSession = async () => {
            try {
                await performRefresh(false);
            } catch {
                clearSession();
            } finally {
                setIsLoading(false);
            }
        };

        void restoreSession();
    }, [performRefresh, clearSession]);

    // Chủ động refresh trước khi access token hết hạn 60 giây.
    // Điều này giúp game WebSocket có token mới khi cần reconnect,
    // ngay cả khi trong khoảng thời gian đó không có REST request.
    useEffect(() => {
        const accessToken = session?.accessToken;

        if (!accessToken) {
            return;
        }

        const expiresAt = getAccessTokenExpirationMs(accessToken);

        if (expiresAt === null) {
            return;
        }

        let cancelled = false;
        let timeoutId: number;

        const scheduleRetry = () => {
            timeoutId = window.setTimeout(
                () => {
                    void refreshNow();
                },
                30_000,
            );
        };

        const refreshNow = async () => {
            try {
                const newAccessToken = await refreshAccessToken();

                if (!newAccessToken && !cancelled) {
                    scheduleRetry();
                }
            } catch {
                if (!cancelled) {
                    scheduleRetry();
                }
            }
        };

        const refreshDelay = Math.max(
            0,
            expiresAt - Date.now() - 60_000,
        );

        timeoutId = window.setTimeout(
            () => {
                void refreshNow();
            },
            refreshDelay,
        );

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [session?.accessToken]);

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