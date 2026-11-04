
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export const HomeHeader: React.FC = () => {
    const { user, logout } = useAuth();

    const displayName = user?.name || user?.email || 'Player';

    const initials = displayName
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');

    return (
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">

                {/* Logo */}
                <Link to="/home" className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl text-emerald-300">
                        ♞
                    </span>

                    <span className="text-base font-bold tracking-wide text-white sm:text-lg">
                        Chess<span className="text-emerald-300">Platform</span>
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="hidden items-center gap-1 sm:flex">
                    <NavLink
                        to="/home"
                        end
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                            }`
                        }
                    >
                        Home
                    </NavLink>

                    <a
                        href="#matchmaking"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
                    >
                        Play
                    </a>
                </nav>

                {/* User */}
                <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                        <p className="max-w-36 truncate text-sm font-medium text-white">
                            {displayName}
                        </p>
                        <p className="text-xs text-slate-500">Player</p>
                    </div>

                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-xs font-semibold text-emerald-200"
                        title={displayName}
                    >
                        {initials || 'P'}
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-200"
                    >
                        <span className="hidden sm:inline">Log out</span>
                        <span className="sm:hidden">Exit</span>
                    </button>
                </div>
            </div>
        </header>
    );
};
