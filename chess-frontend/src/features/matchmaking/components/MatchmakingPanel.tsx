import React, {useState} from 'react';

import {
    TIME_CONTROLS,
    DEFAULT_TIME_CONTROL,
} from '../constants/timeControls';

import type {
    MatchFoundResponse,
    MatchmakingPreset,
    MatchmakingStatus,
} from '../types/matchmaking';

interface MatchmakingPanelProps {
    status: MatchmakingStatus;
    match: MatchFoundResponse | null;
    error: string | null;
    onFindMatch: (preset: MatchmakingPreset) => void;
    onCancelMatch: () => void;
    onResetMatch: () => void;
}

interface StatusView {
    title: string;
    description: string;
}

const STATUS_VIEWS: Partial<Record<MatchmakingStatus, StatusView>> = {
    CONNECTING: {
        title: 'Connecting...',
        description: 'Establishing a connection to the matchmaking server.',
    },
    SEARCHING: {
        title: 'Searching for an opponent...',
        description: 'Please wait while we find a player for you.',
    },
    CANCELLING: {
        title: 'Cancelling search...',
        description: 'Waiting for the server to confirm cancellation.',
    },
};

export const MatchmakingPanel: React.FC<MatchmakingPanelProps> = ({
                                                                      status,
                                                                      match,
                                                                      error,
                                                                      onFindMatch,
                                                                      onCancelMatch,
                                                                      onResetMatch,
                                                                  }) => {
    const [selectedPreset, setSelectedPreset] =
        useState<MatchmakingPreset>(DEFAULT_TIME_CONTROL);

    const isBusy =
        status === 'CONNECTING' ||
        status === 'SEARCHING' ||
        status === 'CANCELLING';

    const canSelectTimeControl = status === 'IDLE';

    const handleFindMatch = () => {
        onFindMatch(selectedPreset);
    };

    return (
        <section
            id="matchmaking"
            className="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-7"
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        Find a match
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                        Play chess online
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                        Choose your preferred time control and get ready to
                        play against another player.
                    </p>
                </div>

                <span
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/>
                    Online matchmaking
                </span>
            </div>

            <div className="mt-7">
                <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-200">
                        Time control
                    </label>

                    <span className="text-xs text-slate-500">
                        Base time + increment
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {TIME_CONTROLS.map((timeControl) => {
                        const isSelected =
                            selectedPreset === timeControl.id;

                        return (
                            <button
                                key={timeControl.id}
                                type="button"
                                disabled={!canSelectTimeControl}
                                aria-pressed={isSelected}
                                onClick={() =>
                                    setSelectedPreset(timeControl.id)
                                }
                                className={`rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isSelected
                                        ? 'border-emerald-300/70 bg-emerald-300/10 ring-1 ring-emerald-300/20'
                                        : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 hover:bg-slate-800/70'
                                }`}
                            >
                                <span className="block text-xl font-bold tabular-nums text-white">
                                    {timeControl.label}
                                </span>

                                <span
                                    className={`mt-1 block text-xs font-medium ${
                                        isSelected
                                            ? 'text-emerald-200'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {timeControl.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {isBusy && (
                <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                    <div className="flex items-center gap-3">
                        {status !== 'CANCELLING' && (
                            <span
                                className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300"/>
                        )}

                        <div>
                            <p className="text-sm font-semibold text-emerald-200">
                                {STATUS_VIEWS[status]?.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                {STATUS_VIEWS[status]?.description}
                            </p>
                        </div>
                    </div>

                    {status === 'SEARCHING' && (
                        <button
                            type="button"
                            onClick={onCancelMatch}
                            className="mt-4 w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/50 hover:bg-red-400/5 hover:text-red-300"
                        >
                            Cancel search
                        </button>
                    )}
                </div>
            )}

            {status === 'MATCHED' && match && (
                <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-5">
                    <p className="text-sm font-semibold text-emerald-300">
                        Match found!
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                        Your opponent has been found. You are ready to play.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-950/60 p-3">
                            <p className="text-xs text-slate-500">
                                Game ID
                            </p>

                            <p className="mt-1 break-all text-sm font-medium text-white">
                                {match.gameId}
                            </p>
                        </div>

                        <div className="rounded-lg bg-slate-950/60 p-3">
                            <p className="text-xs text-slate-500">
                                Your color
                            </p>

                            <p className="mt-1 text-sm font-semibold text-white">
                                {match.assignedColor}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onResetMatch}
                        className="mt-4 w-full rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-200"
                    >
                        Back to matchmaking
                    </button>
                </div>
            )}

            {status === 'ERROR' && (
                <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                    <p className="text-sm font-semibold text-red-300">
                        Matchmaking error
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        {error || 'Something went wrong. Please try again.'}
                    </p>

                    <button
                        type="button"
                        onClick={onResetMatch}
                        className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                    >
                        Try again
                    </button>
                </div>
            )}

            {status === 'IDLE' && (
                <div
                    className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">
                        More time controls can be added as matchmaking options expand.
                    </p>

                    <button
                        type="button"
                        onClick={handleFindMatch}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-200"
                    >
                        Find an opponent
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
            )}
        </section>
    );
};