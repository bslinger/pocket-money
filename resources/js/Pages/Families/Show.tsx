import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Family } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { PlusCircle, UserPlus } from 'lucide-react';

export default function FamilyShow({ family }: { family: Family }) {
    const { data, setData, post, processing, errors, reset } = useForm({ email: '' });

    function submitInvite(e: React.FormEvent) {
        e.preventDefault();
        post(route('families.invite', family.id), { onSuccess: () => reset() });
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">{family.name}</h1>}>
            <Head title={family.name} />
            <div className="space-y-6">
                {/* Members */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Members</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ul className="space-y-2">
                            {family.users?.map(u => (
                                <li key={u.id} className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                            {(u.display_name ?? u.name)[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium leading-none">{u.display_name ?? u.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <form onSubmit={submitInvite} className="flex gap-2 pt-2 border-t">
                            <Input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="Invite by email..."
                                className="flex-1"
                            />
                            <Button type="submit" size="sm" disabled={processing}>
                                <UserPlus className="h-4 w-4 mr-1.5" />
                                Invite
                            </Button>
                        </form>
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </CardContent>
                </Card>

                {/* Spenders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base">Spenders</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('spenders.create')}>
                                <PlusCircle className="h-4 w-4 mr-1.5" />
                                Add spender
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {(family.spenders?.length ?? 0) === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No spenders yet.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {family.spenders?.map(s => (
                                    <Link key={s.id} href={route('spenders.show', s.id)}>
                                        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                            <CardContent className="pt-3 pb-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarFallback
                                                            style={{ backgroundColor: s.color ?? '#6366f1' }}
                                                            className="text-white text-xs font-semibold"
                                                        >
                                                            {s.name[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <p className="font-medium text-sm leading-none">{s.name}</p>
                                                </div>
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {s.accounts?.length ?? 0} account{(s.accounts?.length ?? 0) !== 1 ? 's' : ''}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
