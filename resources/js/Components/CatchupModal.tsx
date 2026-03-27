import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, CheckCircle, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import Modal from '@/Components/Modal';
import type { CatchupData, CatchupSpenderSummary, PocketMoneyEvent } from '@quiddo/shared';

interface Props {
    catchup: CatchupData;
    onDismiss: () => void;
}

export default function CatchupModal({ catchup, onDismiss }: Props) {
    return (
        <Modal show={catchup.has_events} maxWidth="lg" onClose={onDismiss}>
            <div className="p-6 space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-bark-700">While you were away</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Here's what happened with your kids' pocket money. You can adjust any of these.
                    </p>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {catchup.spenders.map(summary => (
                        <SpenderCatchupRow key={summary.spender.id} summary={summary} />
                    ))}
                </div>

                <div className="flex justify-end pt-1">
                    <Button onClick={onDismiss}>Done</Button>
                </div>
            </div>
        </Modal>
    );
}

function SpenderCatchupRow({ summary }: { summary: CatchupSpenderSummary }) {
    const [expanded, setExpanded] = useState(false);
    const { spender, pocket_money_events, goals_met } = summary;

    const releasedCount = pocket_money_events.filter(e => e.status === 'released').length;
    const withheldCount = pocket_money_events.filter(e => e.status === 'withheld').length;
    const totalEvents = pocket_money_events.length;

    const currencySymbol = spender.currency_symbol ?? '$';

    return (
        <div className="border border-bark-200 rounded-card overflow-hidden">
            {/* Summary row */}
            <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bark-50 transition-colors"
            >
                {/* Avatar */}
                <span
                    className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: spender.color ?? '#4A7C59' }}
                >
                    {spender.name[0].toUpperCase()}
                </span>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-bark-700">{spender.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {totalEvents > 0 && (
                            <span>
                                {totalEvents} pocket money run{totalEvents !== 1 ? 's' : ''}
                                {releasedCount > 0 && ` · ${releasedCount} released`}
                                {withheldCount > 0 && ` · ${withheldCount} withheld`}
                            </span>
                        )}
                        {goals_met.length > 0 && (
                            <span>{totalEvents > 0 ? ' · ' : ''}{goals_met.length} goal{goals_met.length !== 1 ? 's' : ''} reached</span>
                        )}
                    </p>
                </div>

                {expanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                }
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-bark-100 divide-y divide-bark-100">
                    {pocket_money_events.map(event => (
                        <PocketMoneyEventRow
                            key={event.id}
                            event={event}
                            currencySymbol={currencySymbol}
                        />
                    ))}
                    {goals_met.map(goal => (
                        <div key={goal.id} className="px-4 py-3 flex items-center gap-3">
                            <Trophy className="h-4 w-4 text-wattle-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-bark-700">{goal.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    Goal reached · {currencySymbol}{parseFloat(goal.target_amount).toFixed(2)}
                                </p>
                            </div>
                            <CheckCircle className="h-4 w-4 text-gumleaf-400 shrink-0" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PocketMoneyEventRow({ event, currencySymbol }: { event: PocketMoneyEvent; currencySymbol: string }) {
    const [processing, setProcessing] = useState(false);

    const date = new Date(event.scheduled_for);
    const dateLabel = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

    function release() {
        setProcessing(true);
        router.post(route('catchup.release', event.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    function reverse() {
        setProcessing(true);
        router.post(route('catchup.reverse', event.id), {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-sm text-bark-700">{dateLabel}</p>
                <p className="text-xs text-muted-foreground">
                    {currencySymbol}{parseFloat(event.amount).toFixed(2)} pocket money
                </p>
            </div>

            {event.status === 'withheld' ? (
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">Withheld</span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={processing}
                        onClick={release}
                        className="text-gumleaf-600 border-gumleaf-300 hover:bg-gumleaf-50 h-7 text-xs"
                    >
                        Release
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gumleaf-600 font-medium">Released</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={processing}
                        onClick={reverse}
                        className="text-redearth-500 hover:text-redearth-600 hover:bg-redearth-50 h-7 text-xs"
                    >
                        Reverse
                    </Button>
                </div>
            )}
        </div>
    );
}
