
import React, { useState } from 'react';

type TimeControl = {
    id: string;
    label: string;
    description: string;
    baseTimeSeconds: number;
    incrementSeconds: number;
};

const TIME_CONTROLS: TimeControl[] = [
    {
        id: 'blitz',
        label: '3 + 2',
        description: 'Blitz',
        baseTimeSeconds: 180,
        incrementSeconds: 2,
    },
    {
        id: 'rapid',
        label: '10 + 0',
        description: 'Rapid',
        baseTimeSeconds: 600,
        incrementSeconds: 0,
    },
    {
        id: 'classical',
        label: '15 + 10',
        description: 'Classical',
        baseTimeSeconds: 900,
        incrementSeconds: 10,
    },
];

export const MatchmakingPanel: React.FC = () => {
    const [selectedTimeControl, setSelectedTimeControl] =
        useState<string>(TIME_CONTROLS[1].id);

    return (
        <section
            id="matchmaking"
            className="scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-7"
        >
            {/* Heading */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        Find a match
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                        Play chess online
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                        Choose your preferred time control and get ready to play against another player.
                    </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Online matchmaking
                </span>
            </div>

            {/* Time control */}
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
                            selectedTimeControl === timeControl.id;

                        return (
                            <button
                                key={timeControl.id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() =>
                                    setSelectedTimeControl(timeControl.id)
                                }
                                className={`rounded-xl border p-4 text-left transition-all ${
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

            {/* Action */}
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                    More time controls can be added as matchmaking options expand.
                </p>

                <button
                    type="button"
                    disabled
                    title="Matchmaking will be connected to the backend in the next step"
                    className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-3 text-sm font-bold text-slate-950 opacity-50"
                >
                    Find an opponent
                    <span aria-hidden="true">→</span>
                </button>
            </div>

            <p className="mt-2 text-right text-xs text-slate-600">
                Matchmaking connection is the next implementation step.
            </p>
        </section>
    );
};
