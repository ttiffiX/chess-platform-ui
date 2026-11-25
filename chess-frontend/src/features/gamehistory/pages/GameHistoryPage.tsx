import React, {
    useEffect,
    useState,
} from 'react';

import {Link} from 'react-router-dom';

import {useAuth} from '../../auth/hooks/useAuth';

import {AppHeader} from '../../../components/layout/AppHeader';
import {Avatar} from '../../../components/common/Avatar';

import {getGameHistory} from '../services/gameHistoryApi';

import type {
    GameHistoryItem,
    GameOutcome,
    PagedResponse,
} from '../types/gameHistory';
import {formatDateTime} from "../../../utils/time.ts";
import type {GameStatus} from "../../game/types/game.ts";
import type {UserInfo} from "../../../types/user.ts";
import {getAvatarUrl, getDisplayName} from "../../../utils/user.ts";

const GAME_STATUS_LABELS: Record<GameStatus, string> = {
    IN_PROGRESS: 'In progress',
    CHECKMATE: 'Checkmate',
    STALEMATE: 'Stalemate',

    DRAW_INSUFFICIENT_MATERIAL: 'Insufficient material',
    DRAW_FIFTY_MOVE_RULE: '50-move rule',
    DRAW_THREEFOLD_REPETITION: 'Threefold repetition',
    DRAW_BY_AGREEMENT: 'Draw by agreement',

    RESIGNED: 'Resignation',
    TIMED_OUT: 'Time out',
};

const OUTCOME_LABELS: Record<GameOutcome, string> = {
    WIN: 'Victory',
    LOSS: 'Defeat',
    DRAW: 'Draw',
};

const OUTCOME_STYLES: Record<GameOutcome, string> = {
    WIN: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    LOSS: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
    DRAW: 'border-slate-600 bg-slate-800 text-slate-300',
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
    ) {
        return error.message;
    }

    return 'Unable to load game history. Please try again.';
};

interface HistoryCardProps {
    game: GameHistoryItem;
    user: UserInfo | null;
}

const HistoryCard: React.FC<HistoryCardProps> = ({game, user}) => {
    return (
        <article className="
            rounded-2xl border border-slate-800
            bg-slate-900/60 p-5
            transition-colors
            hover:border-slate-700
        ">
            {/* Opponent and result */}
            <div className="flex items-center justify-between gap-4">

                <div className="flex min-w-0 items-center gap-3">

                    <Avatar
                        name={getDisplayName(user)}
                        src={getAvatarUrl(user)}
                        size="lg"
                    />

                    <div className="min-w-0">
                        <p className="
                            truncate text-base
                            font-semibold text-white
                        ">
                            {getDisplayName(user)} vs {game.opponent.username}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            {game.playerColor === 'WHITE' ? 'White' : 'Black'} vs {game.playerColor === 'WHITE' ? 'Black' : 'White'}
                        </p>
                    </div>

                    <Avatar
                        name={game.opponent.username}
                        src={game.opponent.avatarUrl}
                        size="lg"
                    />
                </div>

                <span className={`
                    shrink-0 rounded-lg border
                    px-3 py-1.5 text-xs font-bold
                    ${OUTCOME_STYLES[game.outcome]}
                `}>
                    {OUTCOME_LABELS[game.outcome]}
                </span>
            </div>

            {/* Game details */}
            <div className="
                mt-5 grid grid-cols-2 gap-4
                border-t border-slate-800 pt-4
                sm:grid-cols-4
            ">
                <div>
                    <p className="text-xs text-slate-500">
                        Time control
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                        {game.timeControlPreset}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-slate-500">
                        Game result
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                        {GAME_STATUS_LABELS[game.gameStatus]}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-slate-500">
                        Plies
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                        {game.plyCount}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-slate-500">
                        Finished at
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                        {formatDateTime(game.endedAt)}
                    </p>
                </div>
            </div>
        </article>
    );
};

export const GameHistoryPage: React.FC = () => {
    const {user, logout} = useAuth();

    const [page, setPage] = useState(0);

    const [historyPage, setHistoryPage] =
        useState<PagedResponse<GameHistoryItem> | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [reloadKey, setReloadKey] = useState(0);

    // Fetch game history whenever page changes.
    useEffect(() => {
        let cancelled = false;

        const loadHistory = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await getGameHistory(page);

                if (!cancelled) {
                    setHistoryPage(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(getErrorMessage(err));
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadHistory();

        return () => {
            cancelled = true;
        };
    }, [page, reloadKey]);

    const games = historyPage?.content ?? [];

    const totalElements =
        historyPage?.page.totalElements ?? 0;

    const totalPages =
        historyPage?.page.totalPages ?? 0;

    const currentPage =
        historyPage?.page.number ?? page;

    const canGoPrevious =
        currentPage > 0;

    const canGoNext =
        currentPage + 1 < totalPages;

    return (
        <div className="min-h-screen bg-slate-950 text-white">

            <AppHeader
                user={user}
                onLogout={logout}
            />

            <main className="
                mx-auto max-w-6xl
                px-4 pb-16 pt-10
                sm:px-6 sm:pt-14
            ">

                {/* Page heading */}
                <section className="
                    mb-8 flex flex-col
                    gap-4 sm:flex-row
                    sm:items-end sm:justify-between
                ">
                    <div>
                        <p className="
                            text-sm font-semibold
                            uppercase tracking-wider
                            text-emerald-300
                        ">
                            Your matches
                        </p>

                        <h1 className="
                            mt-2 text-3xl
                            font-bold tracking-tight
                            text-white sm:text-4xl
                        ">
                            Game history
                        </h1>

                        <p className="
                            mt-3 max-w-xl
                            text-sm leading-6
                            text-slate-400
                        ">
                            Review your completed games,
                            results, and match details.
                        </p>
                    </div>

                    {!isLoading && !error && (
                        <div className="
                            inline-flex w-fit items-center
                            gap-2 rounded-xl
                            border border-slate-800
                            bg-slate-900 px-4 py-2.5
                        ">
                            <span className="
                                h-2 w-2 rounded-full
                                bg-emerald-300
                            "/>

                            <span className="
                                text-sm font-medium
                                text-slate-300
                            ">
                                {totalElements} games
                            </span>
                        </div>
                    )}
                </section>

                {/* History content */}
                <section className="
                    rounded-2xl border border-slate-800
                    bg-slate-900/30 p-4
                    sm:p-6
                ">

                    {/* Section title */}
                    <div className="
                        mb-5 flex items-center
                        justify-between gap-3
                    ">
                        <div>
                            <h2 className="
                                text-lg font-semibold text-white
                            ">
                                Recent matches
                            </h2>

                            <p className="
                                mt-1 text-xs text-slate-500
                            ">
                                Sorted by most recent game
                            </p>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="
                            flex min-h-[260px]
                            flex-col items-center
                            justify-center
                        ">
                            <div className="
                                h-8 w-8 animate-spin
                                rounded-full border-2
                                border-slate-600
                                border-t-emerald-300
                            "/>

                            <p className="
                                mt-4 text-sm text-slate-400
                            ">
                                Loading game history...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {!isLoading && error && (
                        <div className="
                            flex min-h-[260px]
                            flex-col items-center
                            justify-center text-center
                        ">
                            <div className="
                                flex h-12 w-12
                                items-center justify-center
                                rounded-xl bg-rose-400/10
                                text-xl text-rose-300
                            ">
                                !
                            </div>

                            <h3 className="
                                mt-4 text-lg
                                font-semibold text-white
                            ">
                                Unable to load history
                            </h3>

                            <p className="
                                mt-2 max-w-sm
                                text-sm text-slate-400
                            ">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => setReloadKey((key) => key + 1)}
                                className="
                                    mt-5 rounded-xl
                                    bg-emerald-300 px-5 py-2.5
                                    text-sm font-bold
                                    text-slate-950
                                    transition hover:bg-emerald-200
                                "
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !error && games.length === 0 && (
                        <div className="
                            flex min-h-[280px]
                            flex-col items-center
                            justify-center text-center
                        ">
                            <div className="
                                flex h-16 w-16
                                items-center justify-center
                                rounded-2xl
                                border border-slate-700
                                bg-slate-800
                                text-3xl text-emerald-300
                            ">
                                ♞
                            </div>

                            <h3 className="
                                mt-5 text-lg
                                font-semibold text-white
                            ">
                                No games yet
                            </h3>

                            <p className="
                                mt-2 max-w-sm
                                text-sm leading-6
                                text-slate-400
                            ">
                                Your completed matches will
                                appear here. Play your first
                                game to start building your history.
                            </p>

                            <Link
                                to="/home"
                                className="
                                    mt-6 rounded-xl
                                    bg-emerald-300 px-5 py-3
                                    text-sm font-bold
                                    text-slate-950
                                    transition hover:bg-emerald-200
                                "
                            >
                                Find a game
                            </Link>
                        </div>
                    )}

                    {/* History list */}
                    {!isLoading && !error && games.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {games.map((game) => (
                                <HistoryCard
                                    key={game.gameId}
                                    game={game}
                                    user={user}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Pagination */}
                {!isLoading && !error && totalPages > 1 && (
                    <div className="
                        mt-6 flex flex-col
                        gap-4 sm:flex-row
                        sm:items-center sm:justify-between
                    ">
                        <p className="text-sm text-slate-500">
                            Showing {games.length} of {totalElements} games
                        </p>

                        <div className="
                            flex items-center
                            justify-between gap-3
                            sm:justify-end
                        ">
                            <button
                                type="button"
                                disabled={!canGoPrevious}
                                onClick={() => setPage(currentPage - 1)}
                                className="
                                    rounded-xl border
                                    border-slate-700
                                    px-4 py-2.5 text-sm
                                    font-medium text-slate-300
                                    transition
                                    hover:bg-slate-800
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                Previous
                            </button>

                            <span className="
                                whitespace-nowrap text-sm
                                text-slate-400
                            ">
                                Page {currentPage + 1} of {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={!canGoNext}
                                onClick={() => setPage(currentPage + 1)}
                                className="
                                    rounded-xl border
                                    border-slate-700
                                    px-4 py-2.5 text-sm
                                    font-medium text-slate-300
                                    transition
                                    hover:bg-slate-800
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};