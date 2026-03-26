import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { ChevronLeft, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/Components/ui/card';
import { PageProps } from '@/types';

export default function Guest({ children, backHref }: PropsWithChildren<{ backHref?: string }>) {
    const { flash } = usePage<PageProps>().props;

    return (
        <div className="flex min-h-dvh flex-col items-center justify-start sm:justify-center bg-bark-100 px-4 pt-16 pb-8 sm:pt-0 sm:pb-0 overflow-y-auto">
            <Link href="/" className="flex items-center gap-2 mb-6">
                <Wallet className="h-6 w-6 text-eucalyptus-400" />
                <span className="font-display text-xl font-semibold text-eucalyptus-400">Quiddo</span>
            </Link>
            {backHref && (
                <div className="w-full max-w-sm mb-2">
                    <Link href={backHref} className="inline-flex items-center gap-0.5 text-sm text-bark-600 hover:text-bark-700">
                        <ChevronLeft className="h-4 w-4" />
                        Back to login
                    </Link>
                </div>
            )}
            <Card className="w-full max-w-sm border-bark-200">
                <CardContent className="pt-6">
                    {flash.error && (
                        <p className="mb-4 text-sm text-center text-destructive">{flash.error}</p>
                    )}
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
