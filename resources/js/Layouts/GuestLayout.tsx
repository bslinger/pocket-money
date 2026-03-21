import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
import { Wallet } from 'lucide-react';
import { Card, CardContent } from '@/Components/ui/card';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
            <Link href="/" className="flex items-center gap-2 mb-6 text-foreground font-semibold text-lg">
                <Wallet className="h-6 w-6 text-primary" />
                Quiddo
            </Link>
            <Card className="w-full max-w-sm">
                <CardContent className="pt-6">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
