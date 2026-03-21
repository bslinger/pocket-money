import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PlusCircle, X } from 'lucide-react';
import ColorPicker, { COLOURS } from '@/Components/ColorPicker';

interface KidRow {
    name: string;
    color: string;
}

export default function FamilyCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        spenders: KidRow[];
    }>({
        name: '',
        spenders: [],
    });

    function addKid() {
        const nextColor = COLOURS[data.spenders.length % COLOURS.length];
        setData('spenders', [...data.spenders, { name: '', color: nextColor }]);
    }

    function updateKid(idx: number, field: keyof KidRow, value: string) {
        const updated = data.spenders.map((k, i) => i === idx ? { ...k, [field]: value } : k);
        setData('spenders', updated);
    }

    function removeKid(idx: number) {
        setData('spenders', data.spenders.filter((_, i) => i !== idx));
    }

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
                    <form onSubmit={submit} className="space-y-5">
                        {/* Family name */}
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

                        {/* Kids */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Kids <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <Button type="button" variant="outline" size="sm" onClick={addKid} className="gap-1.5">
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Add Kid
                                </Button>
                            </div>

                            {data.spenders.length > 0 && (
                                <div className="space-y-2">
                                    {data.spenders.map((kid, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <ColorPicker
                                                value={kid.color}
                                                onChange={c => updateKid(idx, 'color', c)}
                                            />
                                            <Input
                                                placeholder={`Kid ${idx + 1} name`}
                                                value={kid.name}
                                                onChange={e => updateKid(idx, 'name', e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => removeKid(idx)}
                                                aria-label="Remove kid"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {data.spenders.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    You can add kids now or after creating the family.
                                </p>
                            )}
                        </div>

                        <Button type="submit" disabled={processing}>Create Family</Button>
                    </form>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
