// src/routes/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { OAuth2RedirectHandler } from '../features/auth/pages/OAuth2RedirectHandler';
import { HomePage } from '../features/home/pages/HomePage';
import { useAuth } from '../context/AuthContext';

// Component bảo vệ Route yêu cầu đăng nhập
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};