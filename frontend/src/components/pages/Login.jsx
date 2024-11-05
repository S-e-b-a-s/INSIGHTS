import { useState, useEffect } from 'react';

// Libraries
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, useField } from 'formik';
import * as Yup from 'yup';
import * as Sentry from '@sentry/react';
import { Toaster, toast } from 'sonner';

// Custom Hooks
import { useSnackbar } from '../context/SnackbarContext';
import { useProgressbar } from '../context/ProgressbarContext';

// Custom Components/Functions
import { getApiUrl } from '../../assets/getApi.js';

// MUI Components
import {
    Box,
    Typography,
    Button,
    TextField,
    Link,
    Alert,
    Collapse,
} from '@mui/material';

// MUI Lab
import { LoadingButton } from '@mui/lab';

// Icons
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import login_image from '../../images/login/new-login-image.jpg';

const validationSchema = Yup.object().shape({
    username: Yup.string().required('Campo requerido'),
    password: Yup.string().required('Campo requerido'),
});

const FormikTextField = ({ label, type, disabled, autoComplete, ...props }) => {
    const [field, meta] = useField(props);
    const errorText = meta.error && meta.touched ? meta.error : '';
    return (
        <TextField
            disabled={disabled}
            sx={{ width: '330px' }}
            type={type}
            label={label}
            {...field}
            helperText={errorText}
            autoComplete={autoComplete}
            error={!!errorText}
        />
    );
};

const Login = () => {
    const [open, setOpen] = useState(false);
    const { showSnack } = useSnackbar();
    const navigate = useNavigate();
    const location = useLocation();
    const showAlert = location.state?.showAlert;
    const lastLocationPath = location.state?.lastLocation
        ? new URL(location.state?.lastLocation).pathname
        : null;
    const [lastLocation, setLastLocation] = useState(null);
    const { isProgressVisible, showProgressbar, hideProgressbar } =
        useProgressbar();

    // Use Effect Hook to update localStorage when items state changes
    useEffect(() => {
        Sentry.init({ environment: getApiUrl().environment });
        let refreshTimer = JSON.parse(localStorage.getItem('refresh-timer-ls'));

        if (
            refreshTimer !== null &&
            refreshTimer.expiry > new Date().getTime()
        ) {
            navigate('/logged/home');
        }
    }, []);

    useEffect(() => {
        if (showAlert) {
            // Show the alert here
            showSnack(
                'info',
                'Has sido desconectado por inactividad. Por favor, inicia sesión nuevamente.'
            );
            // Clear the showAlert state
            setLastLocation(lastLocationPath);
            navigate('.', {
                state: {
                    ...location.state,
                    showAlert: false,
                    lastLocation: null,
                },
                replace: true,
            });
        }
    }, [showAlert, navigate, location, lastLocation]);

    // Constants
    const ERROR_MESSAGES = {
        ACCOUNT_CREATION:
            'Tu usuario esta siendo creado, por favor intenta mas tarde.',
        INVALID_CREDENTIALS:
            'No se puede iniciar sesión con las credenciales proporcionadas.',
        GENERIC_ERROR: 'Ha ocurrido un error. Por favor, inténtelo de nuevo.',
    };

    const REFRESH_TIMER_EXPIRY = 15 * 60 * 60 * 1000; // 15 hours in milliseconds

    // Helper functions
    const saveUserDataToLocalStorage = (data) => {
        const itemsToStore = {
            'refresh-timer-ls': {
                expiry: new Date().getTime() + REFRESH_TIMER_EXPIRY,
            },
            permissions: data.permissions,
            cedula: data.cedula,
            cargo: data.cargo,
            email: data.email,
            rango: data.rango,
        };

        Object.entries(itemsToStore).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    };

    const setupSentryUser = (data, username) => {
        Sentry.setUser({
            id: data.cedula,
            email: data.email,
            username,
        });
    };

    const handleNavigation = (lastLocation, navigate) => {
        const destination = lastLocation || '/logged/home';
        navigate(destination, { replace: true });
    };

    const handleErrorResponse = (response, data) => {
        if (response.status === 400 && data?.non_field_errors?.length > 0) {
            throw new Error(ERROR_MESSAGES.ACCOUNT_CREATION);
        }

        if (response.status === 401 && data?.detail?.length > 0) {
            throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        throw new Error(ERROR_MESSAGES.GENERIC_ERROR);
    };

    const handleSubmit = async (values) => {
        showProgressbar();

        try {
            const response = await fetch(`${getApiUrl().apiUrl}token/obtain/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                handleErrorResponse(response, data);
            }

            if (response.status === 200) {
                saveUserDataToLocalStorage(data);
                setupSentryUser(data, values.username);
                handleNavigation(lastLocation, navigate);
            }
        } catch (error) {
            console.error(error);

            const errorMessage =
                error.message === ERROR_MESSAGES.ACCOUNT_CREATION
                    ? { type: 'info', message: error.message }
                    : error.message === ERROR_MESSAGES.INVALID_CREDENTIALS
                      ? {
                            type: 'error',
                            message: ERROR_MESSAGES.INVALID_CREDENTIALS,
                        }
                      : { type: 'error', message: error.message };

            showSnack(errorMessage.type, errorMessage.message);
        } finally {
            hideProgressbar();
        }
    };

    const handleClick = () => setOpen(!open);

    const ethicalLine = () => {
        navigate('ethical-line');
    };

    // const toastPromise = () => {
    //     const promise = () =>
    //         new Promise((resolve) =>
    //             setTimeout(() => resolve({ name: 'Sonner' }), 2000)
    //         );

    //     toast.promise(promise, {
    //         loading: 'Loading...',
    //         success: (data) => {
    //             return `${data.name} toast has been added`;
    //         },
    //         error: 'Error',
    //     });
    // };

    return (
        <Box sx={{ display: 'flex' }}>
            <Box
                sx={{
                    height: '100vh',
                    width: '65%',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundImage: `url(${login_image})`,
                    clipPath: 'polygon(0% 0%, 75% 0%, 100% 100%, 0% 100%)',
                }}
            ></Box>
            <Box
                sx={{
                    width: '35%',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        width: '100%',
                        height: '30%',
                        paddingRight: '15px',
                    }}
                ></Box>
                <Formik
                    initialValues={{ username: '', password: '', cedula: '' }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    <Form>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '15px',
                            }}
                        >
                            <Typography
                                sx={{ fontFamily: 'Montserrat' }}
                                variant="h3"
                            >
                                Intranet
                            </Typography>

                            <FormikTextField
                                type="text"
                                name="username"
                                label="Usuario de Windows"
                                autoComplete="on"
                                spellCheck={false}
                            />

                            <FormikTextField
                                name="password"
                                label="Contraseña de Windows"
                                type="password"
                                autoComplete="off"
                                spellCheck={false}
                            />

                            <Box sx={{ width: '330px' }}>
                                <Link
                                    onClick={handleClick}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    Has olvidado tu contraseña?{' '}
                                </Link>
                                <Collapse in={open}>
                                    <Alert severity="info">
                                        En caso de olvido o perdida de la
                                        contraseña contacta con tu jefe a cargo
                                        para que te ayude subiendo el ticket
                                        para el restablecimiento de la
                                        contraseña.
                                    </Alert>
                                </Collapse>
                            </Box>
                            <LoadingButton
                                sx={{ fontFamily: 'Montserrat' }}
                                type="submit"
                                variant="contained"
                                startIcon={<LoginOutlinedIcon />}
                                loading={isProgressVisible}
                            >
                                Iniciar Sesión
                            </LoadingButton>
                            <Button
                                onClick={ethicalLine}
                                sx={{ fontFamily: 'Montserrat' }}
                                type="button"
                                variant="outlined"
                                startIcon={<Diversity3Icon />}
                            >
                                Linea ética
                            </Button>
                        </Box>
                    </Form>
                </Formik>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        width: '100%',
                        height: '35%',
                        paddingRight: '15px',
                    }}
                >
                    <Typography variant="subtitle2">
                        C&C SERVICES © - Bogotá D.C. / Colombia.
                    </Typography>
                </Box>
                {/* <button
                    onClick={() =>
                        toast.error(
                            'No se puede iniciar sesión con las credenciales proporcionadas.',
                            { duration: Infinity }
                        )
                    }
                >
                    error
                </button>
                <button onClick={toastPromise}>success</button>
                <button onClick={() => toast.warning('test alert')}>
                    warning
                </button>
                <button onClick={() => toast.info('test alert')}>info</button> */}
            </Box>
            {/* <Toaster richColors position="top-center" /> */}
        </Box>
    );
};

export default Login;
