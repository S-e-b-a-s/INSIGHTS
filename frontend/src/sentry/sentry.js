import { useEffect } from 'react';
import * as Sentry from '@sentry/react';

import {
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
} from 'react-router-dom';

Sentry.init({
    dsn: 'https://5c6491f1c851a0f106e61adad4c4d46c@o4507664328359936.ingest.us.sentry.io/4507664339107840',
    integrations: [
        Sentry.reactRouterV6BrowserTracingIntegration({
            useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes,
        }),
        Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
        }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
});
