import React from 'react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { useAuth } from '../../../context/AuthContext';

export const LoginPage: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-wide">Chess Platform</h1>
                    <p className="text-slate-400 mt-2 text-sm">Login to join real-time chess matches</p>
                </div>

                {!isAuthenticated ? (
                    <div className="space-y-4">
                        <GoogleLoginButton />
                    </div>
                ) : (
                    <div className="space-y-4 text-center">
                        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 text-left">
                            <p className="text-green-400 font-medium">Login successful</p>
                            <p className="text-slate-300 text-sm mt-1"><strong>User ID:</strong> {user?.userId}</p>
                            <p className="text-slate-300 text-sm"><strong>Email:</strong> {user?.email}</p>
                            <p className="text-slate-300 text-sm"><strong>Role:</strong> {user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Log out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};