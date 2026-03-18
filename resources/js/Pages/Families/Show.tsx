import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Family } from '@/types/models';

export default function FamilyShow({ family }: { family: Family }) {
  const { data, setData, post, processing, errors, reset } = useForm({ email: '' });

  function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    post(route('families.invite', family.id), { onSuccess: () => reset() });
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{family.name}</h2>}>
      <Head title={family.name} />
      <div className="py-8 max-w-4xl mx-auto px-4 space-y-8">
        {/* Members */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">Members</h3>
          <ul className="space-y-2">
            {family.users?.map(u => (
              <li key={u.id} className="flex items-center gap-3 text-sm">
                <span className="font-medium">{u.display_name ?? u.name}</span>
                <span className="text-gray-400">{u.email}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={submitInvite} className="mt-4 flex gap-3">
            <input
              type="email"
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              placeholder="Invite by email..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
            <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              Invite
            </button>
          </form>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </section>

        {/* Spenders */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Spenders</h3>
            <Link href={route('spenders.create')} className="text-sm text-indigo-600 hover:underline">+ Add Spender</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {family.spenders?.map(s => (
              <Link key={s.id} href={route('spenders.show', s.id)} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400">
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-gray-400">{s.accounts?.length ?? 0} accounts</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
