import React from 'react';

type ReviewIconType = 'first' | 'previous' | 'next' | 'latest';

interface ReviewIconProps {
    type: ReviewIconType;
}

const ReviewIcon: React.FC<ReviewIconProps> = ({type}) => {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {type === 'first' && (
                <>
                    <path d="M5 5v14"/>
                    <path d="m19 5-7 7 7 7"/>
                </>
            )}

            {type === 'previous' && (
                <path d="m15 18-6-6 6-6"/>
            )}

            {type === 'next' && (
                <path d="m9 18 6-6-6-6"/>
            )}

            {type === 'latest' && (
                <>
                    <path d="M19 5v14"/>
                    <path d="m5 5 7 7-7 7"/>
                </>
            )}
        </svg>
    );
};

const reviewControls: {
    type: ReviewIconType;
    label: string;
}[] = [
    {type: 'first', label: 'First move'},
    {type: 'previous', label: 'Previous move'},
    {type: 'next', label: 'Next move'},
    {type: 'latest', label: 'Latest move'},
];

export const GameActionBar: React.FC = () => {
    return (
        <section className="shrink-0 border-t border-slate-700/70 pt-3">
            {/* Review controls */}
            <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Review game
                </p>

                <div className="grid grid-cols-4 gap-2">
                    {reviewControls.map((control) => (
                        <button
                            key={control.type}
                            type="button"
                            title={control.label}
                            aria-label={control.label}
                            disabled
                            className="
                                flex h-10 items-center justify-center
                                rounded-lg border border-slate-700
                                bg-slate-950 text-slate-300
                                transition
                                hover:bg-slate-800
                                disabled:cursor-not-allowed
                                disabled:opacity-40
                            "
                        >
                            <ReviewIcon type={control.type}/>
                        </button>
                    ))}
                </div>
            </div>

            {/* Game actions */}
            <div className="mt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Game actions
                </p>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        disabled
                        className="
                            rounded-lg border border-slate-700
                            bg-slate-950 px-3 py-2
                            text-xs font-medium text-slate-300
                            transition hover:bg-slate-800
                            disabled:cursor-not-allowed disabled:opacity-40
                        "
                    >
                        Offer draw
                    </button>

                    <button
                        type="button"
                        disabled
                        className="
                            rounded-lg border border-red-500/30
                            bg-red-500/10 px-3 py-2
                            text-xs font-medium text-red-300
                            transition hover:bg-red-500/20
                            disabled:cursor-not-allowed disabled:opacity-40
                        "
                    >
                        Resign
                    </button>
                </div>
            </div>
        </section>
    );
};