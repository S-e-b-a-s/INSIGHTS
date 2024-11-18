import './index.css';
import React, { useEffect, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import {
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
} from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Context
import { ProgressbarProvider } from './components/context/ProgressbarContext';
import { SnackbarProvider } from './components/context/SnackbarContext';

// MUI
import { Backdrop, CircularProgress } from '@mui/material';

// Lazy load components
const ErrorPage = React.lazy(() => import('./components/pages/ErrorPage'));
const Login = React.lazy(() => import('./components/pages/Login'));
const Home = React.lazy(() => import('./components/pages/Home'));
const Blog = React.lazy(() => import('./components/pages/Blog'));
const Article = React.lazy(() => import('./components/pages/Article'));
const Root = React.lazy(() => import('./components/container/root'));
const About = React.lazy(() => import('./components/pages/About'));
const GoalsStats = React.lazy(() => import('./components/pages/GoalsStats'));
const Sgc = React.lazy(() => import('./components/pages/Sgc'));
const UploadFiles = React.lazy(() => import('./components/pages/UploadFiles'));
const EthicalLine = React.lazy(() => import('./components/pages/EthicalLine'));
const Quality = React.lazy(() => import('./components/pages/Quality'));
const Legal = React.lazy(() => import('./components/pages/Legal'));
const Vacancies = React.lazy(() => import('./components/pages/Vacancies'));
const VacanciesReferred = React.lazy(
    () => import('./components/pages/VacanciesReferred')
);
const RiskEvents = React.lazy(() => import('./components/pages/RiskEvents'));
const Payslips = React.lazy(() => import('./components/pages/Payslips'));
const MyPayslips = React.lazy(() => import('./components/pages/MyPayslips'));
const EmploymentCertification = React.lazy(
    () => import('./components/pages/EmploymentCertification')
);
const InactivityDetector = React.lazy(
    () => import('./components/shared/InactivityDetector')
);
const Vacations = React.lazy(() => import('./components/pages/Vacations'));
const PowerBI = React.lazy(() => import('./components/pages/PowerBI'));
const Pqrs = React.lazy(() => import('./components/pages/Pqrs'));
const CoexistenceCommittee = React.lazy(
    () => import('./components/pages/CoexistenceCommittee')
);
const Assistance = React.lazy(() => import('./components/pages/Assistance'));
const Points = React.lazy(() => import('./components/pages/Points'));

Sentry.init({
    dsn: 'https://5c6491f1c851a0f106e61adad4c4d46c@o4507664328359936.ingest.us.sentry.io/4507664339107840',
    integrations: [
        // See docs for support of different versions of variation of react router
        // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
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

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for tracing.
    tracesSampleRate: 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
});

const theme = createTheme({
    typography: {
        fontFamily: [
            'Poppins',
            'Inter',
            'Montserrat',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
    palette: {
        primary: {
            main: '#0076A8',
        },
        secondary: {
            main: '#59CBE8',
        },
        text: {
            primary: '#131313',
            secondary: '#999999',
        },
    },
});

// Loading fallback component
const LoadingFallback = () => (
    <Backdrop sx={{ zIndex: '1002', backgroundColor: 'white' }} open>
        <CircularProgress />
    </Backdrop>
);

// Wrap component with Suspense
const wrapWithSuspense = (Component) => (
    <Suspense fallback={<LoadingFallback />}>
        <Component />
    </Suspense>
);

// Rest of your Sentry and theme configuration remains the same...

const router = createBrowserRouter([
    {
        path: '/',
        element: wrapWithSuspense(Login),
        errorElement: wrapWithSuspense(ErrorPage),
    },
    {
        path: 'ethical-line',
        element: wrapWithSuspense(EthicalLine),
    },
    {
        path: 'test',
        element: wrapWithSuspense(InactivityDetector),
    },
    {
        path: '/logged',
        element: wrapWithSuspense(Root),
        errorElement: wrapWithSuspense(ErrorPage),
        children: [
            {
                path: 'home',
                element: wrapWithSuspense(Home),
            },
            {
                path: 'blog',
                element: wrapWithSuspense(Blog),
            },
            {
                path: 'blog/article/:articleId',
                element: wrapWithSuspense(Article),
            },
            {
                path: 'about',
                element: wrapWithSuspense(About),
            },
            {
                path: 'goals-stats',
                element: wrapWithSuspense(GoalsStats),
            },
            {
                path: 'sgc',
                element: wrapWithSuspense(Sgc),
            },
            {
                path: 'upload-files',
                element: wrapWithSuspense(UploadFiles),
            },
            {
                path: 'ethical-line',
                element: wrapWithSuspense(EthicalLine),
            },
            {
                path: 'quality',
                element: wrapWithSuspense(Quality),
            },
            {
                path: 'legal',
                element: wrapWithSuspense(Legal),
            },
            {
                path: 'vacancies',
                element: wrapWithSuspense(Vacancies),
            },
            {
                path: 'vacancies-referred',
                element: wrapWithSuspense(VacanciesReferred),
            },
            {
                path: 'risk-events',
                element: wrapWithSuspense(RiskEvents),
            },
            {
                path: 'payslips',
                element: wrapWithSuspense(Payslips),
            },
            {
                path: 'my-payslips',
                element: wrapWithSuspense(MyPayslips),
            },
            {
                path: 'employment-certification',
                element: wrapWithSuspense(EmploymentCertification),
            },
            {
                path: 'vacations',
                element: wrapWithSuspense(Vacations),
            },
            {
                path: 'power-bi',
                element: wrapWithSuspense(PowerBI),
            },
            {
                path: 'pqrs',
                element: wrapWithSuspense(Pqrs),
            },
            {
                path: 'coexistence-committee',
                element: wrapWithSuspense(CoexistenceCommittee),
            },
            {
                path: 'assistance',
                element: wrapWithSuspense(Assistance),
            },
            {
                path: 'points',
                element: wrapWithSuspense(Points),
            },
        ],
    },
]);

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
