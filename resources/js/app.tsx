import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { App as CapApp } from '@capacitor/app';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { hydrateRoot } from 'react-dom/client';

CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
        window.history.back();
    } else {
        CapApp.exitApp();
    }
});

const appName = import.meta.env.VITE_APP_NAME || 'Quiddo';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        hydrateRoot(el, <App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
