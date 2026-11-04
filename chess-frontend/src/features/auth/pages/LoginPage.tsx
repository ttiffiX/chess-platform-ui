import React from 'react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

export const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-wide">
                        Chess Platform
                    </h1>

                    <p className="text-slate-400 mt-2 text-sm">
                        Login to join real-time chess matches
                    </p>
                </div>

                <GoogleLoginButton />
            </div>
        </div>
    );
};