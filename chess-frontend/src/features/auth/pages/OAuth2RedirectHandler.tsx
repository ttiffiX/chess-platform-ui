// src/features/auth/components/OAuth2RedirectHandler.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

export const OAuth2RedirectHandler: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkAuthOnBoot } = useAuth();
    const { showError } = useToast();
    const isCalledRef = useRef(false);

    useEffect(() => {
        if (isCalledRef.current) return;
        isCalledRef.current = true;

        const error = searchParams.get('error');
        if (error) {
            // Lấy thông điệp tiếng Anh rõ ràng thông qua Toast
            const errorMessage = error === 'banned'
                ? 'Your account has been banned. Please contact support.'
                : `Authentication failed: ${error}`;

            showError(errorMessage);
            navigate('/login', { replace: true });
            return;
        }

        const handleOAuthCallback = async () => {
            const success = await checkAuthOnBoot();
            if (success) {
                navigate('/home', { replace: true });
            } else {
                navigate('/login', { replace: true });
            }
        };

        handleOAuthCallback();
    }, [searchParams, navigate, checkAuthOnBoot, showError]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Completing authentication...</p>
            </div>
        </div>
    );
};