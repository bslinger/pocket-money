import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Account, RecurringTransaction } from '@/types/models';

interface Props {
    account: Account;
    recurring: RecurringTransaction;
}

const FREQUENCIES = ['daily', 'weekly', 'fortnightly', 'monthly', 'yearly'] as const;

export default function RecurringEdit({ account, recurring }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        type: recurring.type,
        amount: recurring.amount,
        description: recurring.description ?? '',
        frequency: recurring.frequency,
        next_run_at: recurring.next_run_at.slice(0, 16),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(route('accounts.recurring.update', [account.id, recurring.id]));
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Edit Recurring Transaction</h2>}>
            <Head title="Edit Recurring Transaction" />
            <div className="py-8 max-w-lg mx-auto px-4">
                <form onSubmit={submit} className="bg-white border border-bark-200 rounded-card p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Type</label>
                        <select
                            value={data.type}
                            onChange={e => setData('type', e.target.value as 'credit' | 'debit')}
                            className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700"
                        >
                            <option value="credit">Credit (add money)</option>
                            <option value="debit">Debit (remove money)</option>
                        </select>
                        {errors.type && <p className="text-redearth-400 text-xs mt-1">{errors.type}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700"
                        />
                        {errors.amount && <p className="text-redearth-400 text-xs mt-1">{errors.amount}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Description (optional)</label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Frequency</label>
                        <select
                            value={data.frequency}
                            onChange={e => setData('frequency', e.target.value as RecurringTransaction['frequency'])}
                            className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700"
                        >
                            {FREQUENCIES.map(f => (
                                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                            ))}
                        </select>
                        {errors.frequency && <p className="text-redearth-400 text-xs mt-1">{errors.frequency}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Next run date</label>
                        <input
                            type="datetime-local"
                            value={data.next_run_at}
                            onChange={e => setData('next_run_at', e.target.value)}
                            className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700"
                        />
                        {errors.next_run_at && <p className="text-redearth-400 text-xs mt-1">{errors.next_run_at}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-eucalyptus-400 text-white rounded-pill hover:bg-eucalyptus-500 font-semibold disabled:opacity-50"
                    >
                        Save changes
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
