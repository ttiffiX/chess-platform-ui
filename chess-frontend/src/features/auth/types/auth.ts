import type {UserInfo} from '../../../types/user';

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
    logout: () => Promise<void>;
}