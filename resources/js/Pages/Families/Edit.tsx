import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Family } from '@/types/models';

export default function FamilyEdit({ family }: { family: Family }) {
  const { data, setData, put, processing, errors } = useForm({ name: family.name });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    put(route('families.update', family.id));
  }

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Edit Family</h2>}>
      <Head title="Edit Family" />
      <div className="py-8 max-w-lg mx-auto px-4">
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Family Name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <button
            type="submit"
            disabled={processing}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Save Changes
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
