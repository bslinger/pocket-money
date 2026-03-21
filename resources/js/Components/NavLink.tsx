import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-eucalyptus-400 text-bark-700 focus:border-eucalyptus-600'
                    : 'border-transparent text-bark-500 hover:border-bark-300 hover:text-bark-700 focus:border-bark-300 focus:text-bark-700') +
                className
            }
        >
            {children}
        </Link>
    );
}
