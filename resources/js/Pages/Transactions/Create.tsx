import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Account } from '@/types/models';

export default function TransactionCreate({ account }: { account: Account }) {
  const { data, setData, post, processing, errors } = useForm({
    type: 'credit' as 'credit' | 'debit',
    amount: '',
    description: '',
    occurred_at: new Date().toISOString().split('T')[0],
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('accounts.transactions.store', account.id));
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Add Transaction</h2>}>
      <Head title="Add Transaction" />
      <div className="py-8 max-w-lg mx-auto px-4">
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              value={data.type}
              onChange={e => setData('type', e.target.value as 'credit' | 'debit')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="credit">Credit (money in)</option>
              <option value="debit">Debit (money out)</option>
            </select>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={data.occurred_at}
              onChange={e => setData('occurred_at', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={processing}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
