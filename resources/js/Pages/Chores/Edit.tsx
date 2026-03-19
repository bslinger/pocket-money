import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Chore, Family, Spender } from '@/types/models';
import ChoreForm from './ChoreForm';

interface Props {
  chore: Chore & { spenders: Spender[] };
  families: Family[];
  spenders: Spender[];
}

export default function ChoresEdit({ chore, families, spenders }: Props) {
  return (
    <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Edit Chore</h1>}>
      <Head title="Edit Chore" />
      <ChoreForm families={families} spenders={spenders} mode="edit" chore={chore} />
    </AuthenticatedLayout>
  );
}
