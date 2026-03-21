import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Family } from '@/types/models';

export default function FamiliesIndex({ families }: { families: Family[] }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Families</h2>}>
      <Head title="Families" />
      <div className="py-8 max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Your Families</h3>
          <Link href={route('families.create')} className="px-4 py-2 bg-eucalyptus-400 text-white rounded-card hover:bg-eucalyptus-500 text-sm">
            + New Family
          </Link>
        </div>
        <div className="space-y-3">
          {families.map(f => (
            <div key={f.id} className="flex items-center justify-between p-4 bg-white border border-bark-200 rounded-card">
              <span className="font-medium text-bark-700">{f.name}</span>
              <div className="flex gap-3">
                <Link href={route('families.show', f.id)} className="text-sm text-eucalyptus-400 hover:underline">View</Link>
                <Link href={route('families.edit', f.id)} className="text-sm text-bark-500 hover:underline">Edit</Link>
              </div>
            </div>
          ))}
          {families.length === 0 && <p className="text-bark-500 text-sm">No families yet.</p>}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
