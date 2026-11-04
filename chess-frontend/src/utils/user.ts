import type {UserInfo} from '../types/user';

export const getDisplayName = (user: UserInfo | null): string => {
    return user?.name?.trim() || user?.email?.split('@')[0] || 'Player';
};

export const getInitials = (name: string): string => {
    return name
        .trim()
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
};
