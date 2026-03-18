import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

export default function FamilyCreate() {
  const { data, setData, post, processing, errors } = useForm({ name: '' });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('families.store'));
  }

  return (
    <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Create Family</h1>}>
      <Head title="Create Family" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Family details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Family name</Label>
              <Input
                id="name"
                placeholder="e.g. The Smiths"
                value={data.name}
                onChange={e => setData('name', e.target.value)}
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <Button type="submit" disabled={processing}>Create Family</Button>
          </form>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
