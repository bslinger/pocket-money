import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Mail, ShieldAlert } from 'lucide-react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Verify your email</h2>}>
            <Head title="Verify Email" />
            <div className="py-8 max-w-lg mx-auto px-4 space-y-6">
                <div className="bg-wattle-50 border border-wattle-200 rounded-card p-5 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-wattle-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold text-wattle-700">Email not yet verified</p>
                        <p className="text-sm text-wattle-600 mt-1">
                            Please verify your email address to unlock full access.
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-bark-200 rounded-card p-6 space-y-4">
                    <h3 className="font-semibold text-bark-700">What you can&apos;t do yet</h3>
                    <ul className="text-sm text-bark-600 space-y-2">
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-wattle-500 mt-0.5 shrink-0" />
                            <span>Invite other parents or carers to your family</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-wattle-500 mt-0.5 shrink-0" />
                            <span>Transfer billing ownership</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-wattle-500 mt-0.5 shrink-0" />
                            <span>Link children to your account via email</span>
                        </li>
                    </ul>

                    <div className="bg-redearth-50 border border-redearth-200 rounded-lg p-3 text-sm text-redearth-600">
                        <strong>Important:</strong> Accounts that remain unverified by the end of the free trial will be deleted.
                    </div>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="bg-gumleaf-50 border border-gumleaf-200 rounded-card p-4 text-sm text-gumleaf-700">
                        <Mail className="h-4 w-4 inline mr-1.5" />
                        A new verification link has been sent to your email address.
                    </div>
                )}

                <form onSubmit={submit}>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 px-4 bg-eucalyptus-400 text-white rounded-lg hover:bg-eucalyptus-500 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Mail className="h-4 w-4" />
                        Resend Verification Email
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
