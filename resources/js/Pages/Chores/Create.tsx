import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Family, Spender } from '@/types/models';
import ChoreForm from './ChoreForm';

interface Props {
  families: Family[];
  spenders: Spender[];
}

export default function ChoresCreate({ families, spenders }: Props) {
  return (
    <AuthenticatedLayout header={<h1 className="text-xl font-semibold">New Chore</h1>}>
      <Head title="New Chore" />
      <ChoreForm families={families} spenders={spenders} mode="create" />
    </AuthenticatedLayout>
  );
}
