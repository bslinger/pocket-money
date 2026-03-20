import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Account } from '@/types/models';

interface Props {
    account: Account;
    accounts: Account[];
}

export default function TransferCreate({ account, accounts }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        to_account_id: accounts[0]?.id ?? '',
        amount: '',
        description: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('accounts.transfer', account.id));
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Transfer Funds</h2>}>
            <Head title="Transfer Funds" />
            <div className="py-8 max-w-lg mx-auto px-4">
                <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{account.name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Account</label>
                        <select
                            value={data.to_account_id}
                            onChange={e => setData('to_account_id', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                        >
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        {errors.to_account_id && <p className="text-red-500 text-xs mt-1">{errors.to_account_id}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Transfer
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
