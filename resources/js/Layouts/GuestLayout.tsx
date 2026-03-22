import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Wallet } from 'lucide-react';
import { Card, CardContent } from '@/Components/ui/card';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-start sm:justify-center bg-bark-100 px-4 pt-16 pb-8 sm:pt-0 sm:pb-0 overflow-y-auto">
            <Link href="/" className="flex items-center gap-2 mb-6">
                <Wallet className="h-6 w-6 text-eucalyptus-400" />
                <span className="font-display text-xl font-semibold text-eucalyptus-400">Quiddo</span>
            </Link>
            <Card className="w-full max-w-sm border-bark-200">
                <CardContent className="pt-6">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
