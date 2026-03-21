import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-input border border-transparent bg-eucalyptus-400 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-eucalyptus-500 focus:bg-eucalyptus-500 focus:outline-none focus:ring-2 focus:ring-eucalyptus-400 focus:ring-offset-2 active:bg-eucalyptus-600 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
