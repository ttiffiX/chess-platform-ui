// src/features/home/pages/HomePage.tsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext';

export const HomePage: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
            <h1 className="text-4xl font-bold">Hello, {user?.name || user?.email || 'User'}!</h1>
            <p className="text-slate-400 text-sm">Email: {user?.email}</p>
            <p className="text-slate-400 text-sm">Role: {user?.role}</p>
            <button
                onClick={logout}
                className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 font-medium text-white rounded-lg transition-colors cursor-pointer"
            >
                Log out
            </button>
        </div>
    );
};