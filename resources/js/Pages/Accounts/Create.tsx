import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Spender } from '@/types/models';

interface Props {
  spenders: Spender[];
  preselectedSpenderId?: string;
}

export default function AccountCreate({ spenders, preselectedSpenderId }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    spender_id: preselectedSpenderId ?? spenders[0]?.id ?? '',
    name: '',
    is_savings_pot: false,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('accounts.store'));
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Add Account</h2>}>
      <Head title="Add Account" />
      <div className="py-8 max-w-lg mx-auto px-4">
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          {spenders.length > 1 && (
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
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
            <input
              id="name"
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="e.g. Spending Money"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_savings_pot"
              type="checkbox"
              checked={data.is_savings_pot}
              onChange={e => setData('is_savings_pot', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is_savings_pot" className="text-sm text-gray-700 dark:text-gray-300">Savings pot</label>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Add Account
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
