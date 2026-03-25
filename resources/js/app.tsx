import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot, hydrateRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Quiddo';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    setup({ el, App, props }) {
        if (el!.hasChildNodes()) {
            hydrateRoot(el!, <App {...props} />);
        } else {
            createRoot(el!).render(<App {...props} />);
        }
    },
    progress: {
        color: '#4B5563',
    },
});
