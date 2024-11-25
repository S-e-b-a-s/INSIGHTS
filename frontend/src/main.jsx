import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { createBrowserRouter } from 'react-router';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '@theme/theme';
import routes from '@routes/routes';
import '@sentry-d/sentry';
import { ProgressbarProvider } from './contexts/ProgressbarContext';
import { SnackbarProvider } from './contexts/SnackbarContext';

const router = createBrowserRouter(routes, {
    future: {
        v7_relativeSplatPath: true,
        v7_startTransition: true,
        v7_fetcherPersist: true,
        v7_normalizeFormMethod: true,
        v7_partialHydration: true,
        v7_skipActionErrorRevalidation: true,
    },
});

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline>
                <ProgressbarProvider>
                    <SnackbarProvider>
                        <RouterProvider router={router} />
                    </SnackbarProvider>
                </ProgressbarProvider>
            </CssBaseline>
        </ThemeProvider>
    </React.StrictMode>
);
