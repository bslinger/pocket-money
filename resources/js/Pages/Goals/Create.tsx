import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Spender, Account } from '@/types/models';

interface Props {
  spenders: Spender[];
  accounts: Account[];
}

export default function GoalCreate({ spenders, accounts }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    spender_id: spenders[0]?.id ?? '',
    account_id: '',
    name: '',
    target_amount: '',
    target_date: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('goals.store'));
  }

  const spenderAccounts = accounts.filter(a => a.spender_id === data.spender_id);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">New Savings Goal</h2>}>
      <Head title="New Savings Goal" />
      <div className="py-8 max-w-lg mx-auto px-4">
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spender</label>
            <select
              value={data.spender_id}
              onChange={e => setData('spender_id', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              {spenders.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.spender_id && <p className="text-red-500 text-xs mt-1">{errors.spender_id}</p>}
          </div>

          {spenderAccounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Linked Account <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={data.account_id}
                onChange={e => setData('account_id', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                <option value="">None</option>
                {spenderAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Name</label>
            <input
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="e.g. New bike"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.target_amount}
              onChange={e => setData('target_amount', e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
            {errors.target_amount && <p className="text-red-500 text-xs mt-1">{errors.target_amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={data.target_date}
              onChange={e => setData('target_date', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Create Goal
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
