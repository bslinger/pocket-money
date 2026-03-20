import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

const COLOURS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b',
];

export default function SpenderEdit({ spender }: { spender: Spender }) {
    const { data, setData, put, processing, errors } = useForm({
        family_id: spender.family_id,
        name: spender.name,
        color: spender.color ?? COLOURS[0],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('spenders.update', spender.id));
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Edit Spender</h1>}>
            <Head title="Edit Spender" />
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle className="text-base">Spender details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Colour</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLOURS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setData('color', c)}
                                        className={cn(
                                            'h-8 w-8 rounded-full transition-transform',
                                            data.color === c ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'hover:scale-105'
                                        )}
                                        style={{ backgroundColor: c }}
                                        aria-label={c}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button type="submit" disabled={processing}>Save Changes</Button>
                    </form>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
