import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Subscribe to a family's private channel and reload the page when an update arrives.
 */
export function useFamilyChannel(familyId: string | undefined) {
    useEffect(() => {
        if (!familyId || typeof window === 'undefined' || !window.Echo) return;

        const channel = window.Echo.private(`family.${familyId}`);
        channel.listen('.FamilyUpdated', () => {
            router.reload({ only: ['spenders', 'pendingCompletions', 'recentActivity', 'recentApprovedCompletions', 'totalBalance', 'paidThisMonth', 'spender', 'transactions', 'spenderDevices'] });
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
    useEffect(() => {
        if (!spenderId || typeof window === 'undefined' || !window.Echo) return;

        const channel = window.Echo.private(`spender.${spenderId}`);
        channel.listen('.SpenderUpdated', () => {
            router.reload();
        });

        return () => {
            window.Echo?.leave(`private-spender.${spenderId}`);
        };
    }, [spenderId]);
}
