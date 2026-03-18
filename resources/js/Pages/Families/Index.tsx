import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Family } from '@/types/models';

export default function FamiliesIndex({ families }: { families: Family[] }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Families</h2>}>
      <Head title="Families" />
      <div className="py-8 max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Your Families</h3>
          <Link href={route('families.create')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            + New Family
          </Link>
        </div>
        <div className="space-y-3">
          {families.map(f => (
            <div key={f.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <span className="font-medium text-gray-900 dark:text-gray-100">{f.name}</span>
              <div className="flex gap-3">
                <Link href={route('families.show', f.id)} className="text-sm text-indigo-600 hover:underline">View</Link>
                <Link href={route('families.edit', f.id)} className="text-sm text-gray-500 hover:underline">Edit</Link>
              </div>
            </div>
          ))}
          {families.length === 0 && <p className="text-gray-500 text-sm">No families yet.</p>}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
