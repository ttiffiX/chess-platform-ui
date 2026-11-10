import {React, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {useAuth} from '../../auth/context/AuthContext';
import {AppHeader} from '../../../components/layout/AppHeader';
import {MatchmakingPanel} from '../../matchmaking/components/MatchmakingPanel';
import {getDisplayName} from '../../../utils/user';
import {useMatchmaking} from '../../matchmaking/hooks/useMatchmaking';
import {getActiveGameId} from '../../game/services/gameApi';

export const HomePage: React.FC = () => {
    const {user, logout, accessToken} = useAuth();
    const navigate = useNavigate();

    const [activeGameId, setActiveGameId] = useState<string | null>(null);
    const [isCheckingActiveGame, setIsCheckingActiveGame] = useState(true);

    const {
        status,
        match,
        error,
        findMatch,
        cancelMatch,
        resetMatch,
    } = useMatchmaking(accessToken);

    const displayName = getDisplayName(user);

    // Check whether the player has an unfinished game.
    // Do not automatically navigate away from Home.
    useEffect(() => {
        let cancelled = false;

        const checkActiveGame = async () => {
            setIsCheckingActiveGame(true);
            setActiveGameId(null);

            try {
                const gameId = await getActiveGameId();

                if (!cancelled) {
                    setActiveGameId(gameId);
                }
            } catch {
                // Allow the user to continue to the lobby.
                // HTTP errors are handled by the shared Axios interceptor.
            } finally {
                if (!cancelled) {
                    setIsCheckingActiveGame(false);
                }
            }
        };

        if (accessToken) {
            void checkActiveGame();
        } else {
            setIsCheckingActiveGame(false);
        }

        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    // Navigate only when a new match is found.
    useEffect(() => {
        if (status === 'MATCHED' && match?.gameId) {
            navigate(`/game/${match.gameId}`, {
                replace: true,
            });
        }
    }, [status, match, navigate]);

    const handleReturnToGame = () => {
        if (!activeGameId) {
            return;
        }

        navigate(`/game/${activeGameId}`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <AppHeader user={user} onLogout={logout}/>

            <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
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

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="flex min-w-0 flex-col gap-6">
                        {isCheckingActiveGame ? (
                            <div className="
                                flex min-h-[180px] items-center
                                justify-center rounded-2xl
                                border border-slate-800
                                bg-slate-900/60
                            ">
                                <div className="text-center">
                                    <div className="
                                        mx-auto h-7 w-7 animate-spin
                                        rounded-full border-2
                                        border-slate-600
                                        border-t-emerald-300
                                    "/>

                                    <p className="mt-4 text-sm text-slate-400">
                                        Checking for an active game...
                                    </p>
                                </div>
                            </div>
                        ) : activeGameId ? (
                            <div className="
                                rounded-2xl border border-emerald-400/20
                                bg-gradient-to-br from-emerald-400/10
                                to-slate-900 p-6
                            ">
                                <div className="flex items-start gap-4">
                                    <div className="
                                        flex h-12 w-12 shrink-0
                                        items-center justify-center
                                        rounded-xl bg-emerald-400/10
                                        text-2xl text-emerald-300
                                    ">
                                        ♟
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="
                                            text-xs font-semibold
                                            uppercase tracking-wider
                                            text-emerald-300
                                        ">
                                            Game in progress
                                        </p>

                                        <h2 className="mt-2 text-xl font-bold text-white">
                                            Continue your game
                                        </h2>

                                        <p className="mt-2 text-sm leading-6 text-slate-400">
                                            You have an unfinished game.
                                            Return to the board and continue
                                            playing where you left off.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={handleReturnToGame}
                                            className="
                                                mt-5 inline-flex items-center
                                                gap-2 rounded-xl
                                                bg-emerald-300 px-5 py-3
                                                text-sm font-bold
                                                text-slate-950
                                                transition hover:bg-emerald-200
                                            "
                                        >
                                            Return to game
                                            <span aria-hidden="true">→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <MatchmakingPanel
                                status={status}
                                match={match}
                                error={error}
                                onFindMatch={findMatch}
                                onCancelMatch={cancelMatch}
                                onResetMatch={resetMatch}
                            />
                        )}
                    </div>

                    <aside className="flex flex-col gap-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <div className="flex items-center gap-3">
                                <span className="
                                    flex h-10 w-10 items-center
                                    justify-center rounded-xl
                                    bg-slate-800 text-xl
                                ">
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
                                <p className="text-xs text-slate-500">Player</p>

                                <p className="mt-1 break-all text-sm font-medium text-slate-200">
                                    {displayName}
                                </p>

                                <p className="mt-3 text-xs text-slate-500">Email</p>

                                <p className="mt-1 break-all text-sm text-slate-300">
                                    {user?.email || '—'}
                                </p>
                            </div>
                        </div>

                        <div className="
                            rounded-2xl border border-slate-800/80
                            bg-gradient-to-br from-emerald-400/10
                            to-slate-900 p-5
                        ">
                            <p className="
                                text-xs font-semibold uppercase
                                tracking-wider text-emerald-300
                            ">
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