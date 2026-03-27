import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { PasswordInput } from '@/Components/ui/password-input';
import { Label } from '@/Components/ui/label';
import SocialLoginButtons from '@/Components/Auth/SocialLoginButtons';

export default function Register() {
    const { errors: pageErrors } = usePage().props as { errors: Record<string, string> };
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            {pageErrors.social && (
                <div className="mb-4 text-sm text-destructive">{pageErrors.social}</div>
            )}

            <SocialLoginButtons verb="Register" />

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        autoComplete="name"
                        autoFocus
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        required
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        required
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        required
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password_confirmation">Confirm password</Label>
                    <PasswordInput
                        id="password_confirmation"
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        required
                    />
                    {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    Create account
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Already registered?{' '}
                    <Link href={route('login')} className="underline underline-offset-4 hover:text-foreground">
                        Log in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
