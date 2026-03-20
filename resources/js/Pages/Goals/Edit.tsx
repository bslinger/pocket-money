import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { SavingsGoal, Account, Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import ImageUpload from '@/Components/ImageUpload';

interface Props {
    goal: SavingsGoal & { spender: Spender; image_url: string | null };
    accounts: Account[];
}

export default function GoalEdit({ goal, accounts }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name:          goal.name,
        target_amount: goal.target_amount,
        target_date:   goal.target_date ?? '',
        account_id:    goal.account_id ?? '',
        image_key:     goal.image_key ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('goals.update', goal.id));
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Edit Goal</h1>}>
            <Head title="Edit Goal" />
            <form onSubmit={submit} className="max-w-lg space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Goal details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Goal name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="target_amount">Target amount</Label>
                            <Input
                                id="target_amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={data.target_amount}
                                onChange={e => setData('target_amount', e.target.value)}
                            />
                            {errors.target_amount && <p className="text-xs text-destructive">{errors.target_amount}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="target_date">
                                Target date <span className="text-muted-foreground text-xs">(optional)</span>
                            </Label>
                            <Input
                                id="target_date"
                                type="date"
                                value={data.target_date}
                                onChange={e => setData('target_date', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Cover image <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <ImageUpload
                                currentUrl={goal.image_url}
                                onUpload={key => setData('image_key', key)}
                                onClear={() => setData('image_key', '')}
                                label="Add an inspirational photo"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="account_id">Account</Label>
                            <select
                                id="account_id"
                                value={data.account_id}
                                onChange={e => setData('account_id', e.target.value)}
                                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Select an account…</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {errors.account_id && <p className="text-xs text-destructive">{errors.account_id}</p>}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>Save Changes</Button>
                    <Button variant="outline" type="button" asChild>
                        <Link href={route('goals.show', goal.id)}>Cancel</Link>
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
