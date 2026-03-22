import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Account, RecurringTransaction } from '@/types/models';

interface Props {
    account: Account;
    recurrings: RecurringTransaction[];
}

export default function RecurringIndex({ account, recurrings }: Props) {
    function destroy(recurring: RecurringTransaction) {
        if (!confirm('Delete this recurring transaction?')) { return; }
        router.delete(route('accounts.recurring.destroy', [account.id, recurring.id]));
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Recurring Transactions — {account.name}</h2>}>
            <Head title={`Recurring – ${account.name}`} />
            <div className="py-8 max-w-2xl mx-auto px-4 space-y-4">
                <div className="flex justify-end">
                    <Link
                        href={route('accounts.recurring.create', account.id)}
                        className="px-4 py-2 bg-eucalyptus-400 text-white rounded-pill text-sm font-semibold hover:bg-eucalyptus-500"
                    >
                        Add recurring
                    </Link>
                </div>

                {recurrings.length === 0 ? (
                    <p className="text-bark-500 text-sm">No recurring transactions set up yet.</p>
                ) : (
                    <ul className="space-y-3">
                        {recurrings.map(r => (
                            <li key={r.id} className="bg-white border border-bark-200 rounded-card p-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-medium text-bark-700 capitalize">{r.type} · {r.frequency}</p>
                                    {r.description && <p className="text-bark-500 text-sm">{r.description}</p>}
                                    <p className="text-bark-500 text-sm">Next: {new Date(r.next_run_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${r.type === 'credit' ? 'text-eucalyptus-500' : 'text-redearth-400'}`}>
                                        {r.type === 'credit' ? '+' : '-'}{account.currency_symbol ?? '$'}{r.amount}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <Link
                                            href={route('accounts.recurring.edit', [account.id, r.id])}
                                            className="text-xs text-eucalyptus-500 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => destroy(r)}
                                            className="text-xs text-redearth-400 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
