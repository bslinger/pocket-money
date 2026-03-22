import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Spender, Account } from '@/types/models';
import ImageUpload from '@/Components/ImageUpload';
import { spenderUsesIntegers } from '@/lib/utils';

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
    image_key: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('goals.store'));
  }

  const spenderAccounts = accounts.filter(a => a.spender_id === data.spender_id);
  const selectedSpender = spenders.find(s => s.id === data.spender_id);
  const useIntegers = spenderUsesIntegers(selectedSpender ?? { use_integer_amounts: null });

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">New Savings Goal</h2>}>
      <Head title="New Savings Goal" />
      <div className="py-8 max-w-lg mx-auto px-4">
        <form onSubmit={submit} className="bg-white border border-bark-200 rounded-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1">Spender</label>
            <select
              value={data.spender_id}
              onChange={e => { setData(d => ({ ...d, spender_id: e.target.value, account_id: '' })); }}
              className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700 focus:border-eucalyptus-400 focus:ring-eucalyptus-400"
            >
              {spenders.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.spender_id && <p className="text-redearth-400 text-xs mt-1">{errors.spender_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1">Account</label>
            {spenderAccounts.length === 0 ? (
              <p className="text-sm text-bark-500">This spender has no accounts yet. <a href={route('accounts.create', { spender_id: data.spender_id })} className="underline">Add one first.</a></p>
            ) : (
              <select
                value={data.account_id}
                onChange={e => setData('account_id', e.target.value)}
                className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700 focus:border-eucalyptus-400 focus:ring-eucalyptus-400"
              >
                <option value="">Select an account…</option>
                {spenderAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
            {errors.account_id && <p className="text-redearth-400 text-xs mt-1">{errors.account_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1">Goal Name</label>
            <input
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="e.g. New bike"
              className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700 focus:border-eucalyptus-400 focus:ring-eucalyptus-400"
              autoFocus
            />
            {errors.name && <p className="text-redearth-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1">Target Amount</label>
            <input
              type="number"
              step={useIntegers ? '1' : '0.01'}
              min={useIntegers ? '1' : '0.01'}
              value={data.target_amount}
              onChange={e => setData('target_amount', e.target.value)}
              placeholder={useIntegers ? '0' : '0.00'}
              className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700 focus:border-eucalyptus-400 focus:ring-eucalyptus-400"
            />
            {errors.target_amount && <p className="text-redearth-400 text-xs mt-1">{errors.target_amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1">
              Target Date <span className="text-bark-400">(optional)</span>
            </label>
            <input
              type="date"
              value={data.target_date}
              onChange={e => setData('target_date', e.target.value)}
              className="w-full border border-bark-200 rounded-input px-3 py-2 text-bark-700 focus:border-eucalyptus-400 focus:ring-eucalyptus-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1">
              Cover image <span className="text-bark-400">(optional)</span>
            </label>
            <ImageUpload
              onUpload={key => setData('image_key', key)}
              onClear={() => setData('image_key', '')}
              label="Add an inspirational photo"
              aspect={16 / 9}
            />
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-2 bg-eucalyptus-400 text-white rounded-pill hover:bg-eucalyptus-500 font-semibold disabled:opacity-50"
          >
            Create Goal
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
