import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Spender } from '@/types/models';

interface Props {
    spender: Spender;
}

export default function SpenderEdit({ spender }: Props) {
    useEffect(() => {
        window.location.replace(route('spenders.show', spender.id) + '?tab=manage');
    }, [spender.id]);

    return null;
}
