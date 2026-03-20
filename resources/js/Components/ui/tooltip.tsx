import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ children }: { children: React.ReactNode }) {
    return (
        <TooltipPrimitive.Root delayDuration={600}>
            {children}
        </TooltipPrimitive.Root>
    );
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                sideOffset={4}
                className={cn(
                    'z-50 max-w-xs rounded-md bg-gray-900 dark:bg-gray-100 px-3 py-1.5 text-xs text-white dark:text-gray-900 shadow-md animate-in fade-in-0 zoom-in-95',
                    className,
                )}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow className="fill-gray-900 dark:fill-gray-100" />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    );
}
