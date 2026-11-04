
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { HomeHeader } from '../components/HomeHeader';
import { MatchmakingPanel } from '../components/MatchmakingPanel';

export const HomePage: React.FC = () => {
    const { user } = useAuth();

    const displayName =
        user?.name || user?.email?.split('@')[0] || 'Player';

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <HomeHeader />

            <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">

                {/* Welcome */}
                <section className="mb-8 sm:mb-10">
                    <p className="text-sm font-medium text-emerald-300">
                        Welcome back
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Good to see you, {displayName}.
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                        Your next game is just a move away.
                        Choose a time control and find an opponent.
                    </p>
                </section>

                {/* Main content */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">

                    <MatchmakingPanel />

                    {/* Account information */}
                    <aside className="flex flex-col gap-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xl">
                                    ♟
                                </span>

                                <div>
                                    <h2 className="text-sm font-semibold text-white">
                                        Your account
                                    </h2>

                                    <p className="text-xs text-slate-500">
                                        Signed in successfully
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-slate-800 pt-4">
                                <p className="text-xs text-slate-500">
                                    Player
                                </p>

                                <p className="mt-1 break-all text-sm font-medium text-slate-200">
                                    {user?.name || 'Chess player'}
                                </p>

                                <p className="mt-3 text-xs text-slate-500">
                                    Email
                                </p>

                                <p className="mt-1 break-all text-sm text-slate-300">
                                    {user?.email || '—'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-br from-emerald-400/10 to-slate-900 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                                Keep improving
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                Every game is a chance to learn, practice,
                                and sharpen your strategy.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};
