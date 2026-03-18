import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Family } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

const COLOURS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#0ea5e9', // sky
    '#64748b', // slate
];

export default function SpenderCreate({ families }: { families: Family[] }) {
    const { data, setData, post, processing, errors } = useForm({
        family_id: families[0]?.id ?? '',
        name: '',
        color: COLOURS[0],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('spenders.store'));
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Add Spender</h1>}>
            <Head title="Add Spender" />
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle className="text-base">Spender details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-5">
                        {/* Family — only show if parent has multiple families */}
                        {families.length > 1 && (
                            <div className="space-y-1.5">
                                <Label htmlFor="family_id">Family</Label>
                                <select
                                    id="family_id"
                                    value={data.family_id}
                                    onChange={e => setData('family_id', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {families.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                {errors.family_id && <p className="text-xs text-destructive">{errors.family_id}</p>}
                            </div>
                        )}

                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Emma"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {/* Colour */}
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

                        {/* Preview */}
                        <div className="flex items-center gap-3 py-2">
                            <div
                                className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                style={{ backgroundColor: data.color }}
                            >
                                {data.name ? data.name[0].toUpperCase() : '?'}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {data.name || 'Spender name'}
                            </span>
                        </div>

                        <Button type="submit" disabled={processing}>Add Spender</Button>
                    </form>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
