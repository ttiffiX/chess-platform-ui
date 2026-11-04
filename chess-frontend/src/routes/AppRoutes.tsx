import React from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';

import {LoginPage} from '../features/auth/pages/LoginPage';
import {OAuth2RedirectHandler} from '../features/auth/pages/OAuth2RedirectHandler';
import {HomePage} from '../features/home/pages/HomePage';
import {GamePage} from '../features/game/pages/GamePage';

import {useAuth} from '../features/auth/context/AuthContext';

const LoadingPage: React.FC = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
    </div>
);

// Chỉ cho phép người đã đăng nhập truy cập.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({children,}) => {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
        return <LoadingPage/>;
    }

    return isAuthenticated
        ? <>{children}</>
        : <Navigate to="/login" replace/>;
};

// Chỉ cho phép người chưa đăng nhập truy cập.
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({children,}) => {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
        return <LoadingPage/>;
    }

    return isAuthenticated
        ? <Navigate to="/home" replace/>
        : <>{children}</>;
};

// Điều hướng mặc định dựa trên trạng thái đăng nhập.
const RootRedirect: React.FC = () => {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) {
        return <LoadingPage/>;
    }

    return (
        <Navigate
            to={isAuthenticated ? '/home' : '/login'}
            replace
        />
    );
};

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicOnlyRoute>
                        <LoginPage/>
                    </PublicOnlyRoute>
                }
            />

            <Route
                path="/oauth2/redirect"
                element={<OAuth2RedirectHandler/>}
            />

            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <HomePage/>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/game/:gameId"
                element={
                    <ProtectedRoute>
                        <GamePage/>
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<RootRedirect/>}/>
        </Routes>
    );
};