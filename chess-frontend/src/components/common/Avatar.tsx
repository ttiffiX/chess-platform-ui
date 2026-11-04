import React from 'react';
import { getInitials } from '../../utils/user';

interface AvatarProps {
    name: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
};

export const Avatar: React.FC<AvatarProps> = ({name, size = 'md',}) => {
    const initials = getInitials(name);

    return (
        <div
            title={name}
            aria-label={`Avatar of ${name}`}
            className={`flex shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 font-semibold text-emerald-200 ${sizeClasses[size]}`}
        >
            {initials || 'P'}
        </div>
    );
};
