import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

export default function CompleteProfile({ name }: { name: string | null }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('auth.social.complete-profile.store'));
    };

    return (
        <GuestLayout>
            <Head title="One more step" />

            <div className="mb-6">
                <h1 className="text-lg font-semibold text-bark-700">
                    One more step{name ? `, ${name.split(' ')[0]}` : ''}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    We couldn't get your email from your social account. Please enter it below to finish signing in.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    Continue
                </Button>
            </form>
        </GuestLayout>
    );
}
