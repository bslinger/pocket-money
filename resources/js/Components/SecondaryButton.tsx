import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-input border border-eucalyptus-400 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-eucalyptus-400 shadow-sm transition duration-150 ease-in-out hover:bg-eucalyptus-50 focus:outline-none focus:ring-2 focus:ring-eucalyptus-400 focus:ring-offset-2 disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
