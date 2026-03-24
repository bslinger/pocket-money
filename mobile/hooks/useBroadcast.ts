import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getEcho } from '@/lib/echo';
import { queryClient } from '@/lib/queryClient';

/**
 * Subscribe to a family's private channel. Invalidates parent dashboard queries on update.
 */
export function useFamilyChannel(familyId: string | undefined): void {
  const { isChildDevice } = useAuth();

  useEffect(() => {
    if (!familyId) return;

    let echo: ReturnType<typeof getEcho>;
    try {
      echo = getEcho(isChildDevice);
    } catch {
      return;
    }

    const channel = echo.private(`family.${familyId}`);
    channel.listen('.FamilyUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
      queryClient.invalidateQueries({ queryKey: ['chores'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    });

    return () => {
      echo.leave(`private-family.${familyId}`);
    };
  }, [familyId, isChildDevice]);
}

/**
 * Subscribe to a spender's private channel. Invalidates child dashboard queries on update.
 */
export function useSpenderChannel(spenderId: string | undefined): void {
  const { isChildDevice } = useAuth();

  useEffect(() => {
    if (!spenderId) return;

    let echo: ReturnType<typeof getEcho>;
    try {
      echo = getEcho(isChildDevice);
    } catch {
      return;
    }

    const channel = echo.private(`spender.${spenderId}`);
    channel.listen('.SpenderUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'child'] });
    });

    return () => {
      echo.leave(`private-spender.${spenderId}`);
    };
  }, [spenderId, isChildDevice]);
}
