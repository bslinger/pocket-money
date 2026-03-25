import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * Debounced reload — avoids stacking reloads when multiple events fire
 * or when a user action already triggered a page visit.
 */
function useDebouncedReload() {
    const timer = useRef<ReturnType<typeof setTimeout>>();

    return () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            router.reload({ preserveState: true, preserveScroll: true });
        }, 500);
    };
}

/**
 * Subscribe to a family's private channel and reload the page when an update arrives.
 */
export function useFamilyChannel(familyId: string | undefined) {
    const reload = useDebouncedReload();

    useEffect(() => {
        if (!familyId || typeof window === 'undefined' || !window.Echo) return;

        console.log('[Echo] Subscribing to private-family.' + familyId);
        const channel = window.Echo.private(`family.${familyId}`);

        channel.listen('.FamilyUpdated', () => {
            console.log('[Echo] FamilyUpdated received!');
            reload();
        });

        channel.error((error: any) => {
            console.error('[Echo] Channel error:', error);
        });

        return () => {
            window.Echo?.leave(`private-family.${familyId}`);
        };
    }, [familyId]);
}

/**
 * Subscribe to a spender's private channel and reload the page when an update arrives.
 */
export function useSpenderChannel(spenderId: string | undefined) {
    const reload = useDebouncedReload();

    useEffect(() => {
        if (!spenderId || typeof window === 'undefined' || !window.Echo) return;

        console.log('[Echo] Subscribing to private-spender.' + spenderId);
        const channel = window.Echo.private(`spender.${spenderId}`);

        channel.listen('.SpenderUpdated', () => {
            console.log('[Echo] SpenderUpdated received, reloading...');
            router.reload({
                preserveScroll: true,
                onSuccess: () => console.log('[Echo] Reload completed'),
                onError: (errors) => console.error('[Echo] Reload error:', errors),
            });
        });

        channel.error((error: any) => {
            console.error('[Echo] Channel error:', error);
        });

        return () => {
            window.Echo?.leave(`private-spender.${spenderId}`);
        };
    }, [spenderId]);
}
