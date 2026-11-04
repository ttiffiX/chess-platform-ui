import React, {useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';

import {useAuth} from '../context/AuthContext';
import {useToast} from '../../../context/ToastContext';

export const OAuth2RedirectHandler: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const {isAuthenticated, isLoading} = useAuth();
    const {showError} = useToast();

    const error = searchParams.get('error');

    useEffect(() => {
        if (error) {
            const errorMessage = error === 'banned'
                ? 'Your account has been banned. Please contact support.'
                : `Authentication failed: ${error}`;

            showError(errorMessage);
            navigate('/login', {replace: true});
            return;
        }

        // Chờ AuthProvider hoàn thành refresh session.
        if (isLoading) {
            return;
        }

        navigate(
            isAuthenticated ? '/home' : '/login',
            {replace: true},
        );
    }, [
        error,
        isLoading,
        isAuthenticated,
        navigate,
        showError,
    ]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                <p className="text-slate-400 text-sm">
                    Completing authentication...
                </p>
            </div>
        </div>
    );
};