import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-bark-200 text-eucalyptus-400 shadow-sm focus:ring-eucalyptus-400 ' +
                className
            }
        />
    );
}
