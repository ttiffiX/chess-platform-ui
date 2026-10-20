// src/types/auth.ts

export interface UserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface AuthResponse {
    accessToken: string;
    tokenType: string;
    userInfo: UserInfo;
}

export interface AuthContextType {
    accessToken: string | null;
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginSuccess: (data: AuthResponse) => void;
    logout: () => Promise<void>;
    checkAuthOnBoot: () => Promise<boolean>;
}