import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-eucalyptus-400 bg-eucalyptus-50 text-eucalyptus-600 focus:border-eucalyptus-600 focus:bg-eucalyptus-100 focus:text-eucalyptus-700'
                    : 'border-transparent text-bark-600 hover:border-bark-300 hover:bg-bark-50 hover:text-bark-700 focus:border-bark-300 focus:bg-bark-50 focus:text-bark-700'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
