import { createInertiaApp } from '@inertiajs/react';
import { route as ziggyRoute } from 'ziggy-js';
import { Ziggy } from './ziggy';

globalThis.route = ((name: string, params?: any, absolute?: boolean) =>
    ziggyRoute(name, params, absolute, Ziggy as any)) as typeof ziggyRoute;

const appName = import.meta.env.VITE_APP_NAME || 'Quiddo';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    setup({ App, props }) {
        return <App {...props} />;
    },
});
