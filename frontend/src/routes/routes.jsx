// src/routes.js
import { lazy, Suspense } from 'react';

// Lazy load components
const ErrorPage = lazy(() => import('../components/pages/ErrorPage'));
const Login = lazy(() => import('../components/pages/Login'));
const Home = lazy(() => import('../components/pages/Home'));
const Blog = lazy(() => import('../components/pages/Blog'));
const Article = lazy(() => import('../components/pages/Article'));
const Root = lazy(() => import('../components/layout/root'));
const About = lazy(() => import('../components/pages/About'));
const GoalsStats = lazy(() => import('../components/pages/GoalsStats'));
const Sgc = lazy(() => import('../components/pages/Sgc'));
const UploadFiles = lazy(() => import('../components/pages/UploadFiles'));
const EthicalLine = lazy(() => import('../components/pages/EthicalLine'));
const Quality = lazy(() => import('../components/pages/Quality'));
const Legal = lazy(() => import('../components/pages/Legal'));
const Vacancies = lazy(() => import('../components/pages/vacancies/Vacancies'));
const VacanciesReferred = lazy(
    () => import('../components/pages/vacancies/VacanciesReferred')
);
const RiskEvents = lazy(() => import('../components/pages/RiskEvents'));
const Payslips = lazy(() => import('../components/pages/payslips/Payslips'));
const MyPayslips = lazy(() => import('../components/pages/payslips/MyPayslips'));
const EmploymentCertification = lazy(
    () => import('../components/pages/EmploymentCertification')
);
const Vacations = lazy(() => import('../components/pages/vacations/Vacations'));
const PowerBI = lazy(() => import('../components/pages/PowerBI'));
const Pqrs = lazy(() => import('../components/pages/Pqrs'));
const CoexistenceCommittee = lazy(
    () => import('../components/pages/CoexistenceCommittee')
);
const Assistance = lazy(() => import('../components/pages/Assistance'));
const Points = lazy(() => import('../components/pages/Points'));

const wrapWithSuspense = (Component) => (
    <Suspense>
        <Component />
    </Suspense>
);

const routes = [
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
                path: 'employment-certifications',
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
];

export default routes;
