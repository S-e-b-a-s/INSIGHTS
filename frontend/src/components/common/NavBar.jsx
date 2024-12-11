import { useState, useEffect, lazy, Suspense } from 'react';

// Libraries
import { useNavigate, useMatch } from 'react-router';

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext';

// Custom Components/Functions
const Goals = lazy(() => import('@components/shared/Goals'));
const InactivityDetector = lazy(
    () => import('@components/shared/InactivityDetector')
);
const Notifications = lazy(() => import('@components/shared/Notifications'));
const EmploymentCertificationRequest = lazy(
    () => import('./EmploymentCertificationRequest')
);
const MenuAccount = lazy(() => import('./MenuAccount'));
const MenuServices = lazy(() => import('./MenuServices'));

import { getApiUrl } from '@assets/getApi';
import { handleError } from '@assets/handleError';

// Material-UI
import { Box, Button, Tooltip, IconButton, Avatar, Badge } from '@mui/material';

// Icons
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import NotificationsIcon from '@mui/icons-material/Notifications';

// Media
const companyLogo = `${getApiUrl().apiUrl}/static/images/company-logos/logo-navbar.webp`;

const Navbar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorElUtils, setAnchorElUtils] = useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const openUtils = Boolean(anchorElUtils);
    const [openDialog, setOpenDialog] = useState(false);
    const cargoItem = localStorage.getItem('cargo');
    const isAdvisor = cargoItem && JSON.parse(cargoItem).includes('ASESOR');
    const permissions = JSON.parse(localStorage.getItem('permissions'));
    const [anchorNotification, setAnchorNotification] = useState(null);
    const openNotification = Boolean(anchorNotification);
    const [notifications, setNotifications] = useState([]);
    const operationalRiskPermission =
        permissions && permissions.includes('operational_risk.view_events');
    const rank = JSON.parse(localStorage.getItem('rango'));
    const [openCertification, setOpenCertification] = useState(false);
    const { showSnack } = useSnackbar();

    const servicesPermission =
        permissions &&
        (permissions.includes('users.upload_robinson_list') ||
            permissions.includes('goals.view_goals') ||
            permissions.includes('excels_processing.call_transfer') ||
            permissions.includes('contracts.view_contract') ||
            permissions.includes('operational_risk.view_events') ||
            permissions.includes('vacancy.view_reference') ||
            permissions.includes('payslip.add_payslip') ||
            permissions.includes(
                'employment_management.view_employmentcertification'
            ) ||
            permissions.includes('goals.add_goals') ||
            permissions.includes('vacation.view_vacationrequest') ||
            rank > 1);

    const refreshToken = async (refreshTimer) => {
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}token/refresh/`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                if (refreshTimer === null) {
                    localStorage.setItem(
                        'refresh-timer-ls',
                        JSON.stringify({
                            expiry: new Date().getTime() + 15 * 60 * 60 * 1000, // 24 hours from now
                        })
                    );
                } else {
                    let refreshTimer = JSON.parse(
                        localStorage.getItem('refresh-timer-ls')
                    );
                    refreshTimer.expiry =
                        new Date().getTime() + 15 * 60 * 60 * 1000; // 15 hours from now

                    // Store the item again
                    localStorage.setItem(
                        'refresh-timer-ls',
                        JSON.stringify(refreshTimer)
                    );
                }
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        let refreshTimer = JSON.parse(localStorage.getItem('refresh-timer-ls'));
        // Check if the item has expired
        if (
            refreshTimer === null ||
            refreshTimer.expiry < new Date().getTime()
        ) {
            refreshToken(refreshTimer);
        }
    }, []);

    const handleUtilitariosMenuOpen = (event) => {
        setAnchorElUtils(event.currentTarget);
    };

    function CustomNavLink({ to, children }) {
        let match = useMatch(to);
        return (
            <Button
                onClick={() => navigate(to)}
                sx={{
                    minWidth: 100,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderBottom: '2px solid transparent', // Add a transparent bottom border
                    transition: 'all 0.3s ease',
                    padding: '1.5rem 1rem    ', // Adjust padding to keep text aligned with the container
                    borderBottomColor: match ? '#0076A8' : 'transparent',
                    color: match ? '#0076A8' : 'inherit',
                    '&:hover': {
                        color: '#0076A8',
                        borderBottomColor: '#0076A8', // Change the background color on hover
                    },
                }}
            >
                {children}
            </Button>
        );
    }

    const getNotifications = async () => {
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}notifications/`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        getNotifications();
    }, [openNotification]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOpenNotification = (event) => {
        setAnchorNotification(event.currentTarget);
    };

    const handleLogout = async (inactivity) => {
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}token/destroy/`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            if (response.status === 200) {
                localStorage.removeItem('refresh-timer-ls');
                if (inactivity === true) {
                    // Pass a parameter to the login component to show an alert
                    const currentUrl = window.location.href;
                    navigate('/', {
                        state: { showAlert: true, lastLocation: currentUrl },
                    });
                } else {
                    navigate('/');
                }
            } else {
                localStorage.removeItem('refresh-timer-ls');
                navigate('/');
            }

            await handleError(response, showSnack);
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    return (
        <>
            <Suspense>
                {isAdvisor ? (
                    <Goals
                        openDialog={openDialog}
                        setOpenDialog={setOpenDialog}
                        showSnack={showSnack}
                    />
                ) : null}

                <Notifications
                    notifications={notifications}
                    setAnchorNotification={setAnchorNotification}
                    anchorNotification={anchorNotification}
                    openNotification={openNotification}
                    getNotifications={getNotifications}
                />

                {getApiUrl().environment === 'production' ? (
                    <InactivityDetector handleLogout={handleLogout} />
                ) : null}

                <EmploymentCertificationRequest
                    openCertification={openCertification}
                    setOpenCertification={setOpenCertification}
                />

                <MenuAccount
                    open={open}
                    setAnchorEl={setAnchorEl}
                    anchorEl={anchorEl}
                    isAdvisor={isAdvisor}
                    setOpenCertification={setOpenCertification}
                    rank={rank}
                    handleLogout={handleLogout}
                    setOpenDialog={setOpenDialog}
                />

                <MenuServices
                    openUtils={openUtils}
                    anchorElUtils={anchorElUtils}
                    setAnchorElUtils={setAnchorElUtils}
                />
            </Suspense>
            <Box
                className="navbar"
                sx={{
                    backdropFilter: 'blur(10px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1001,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255, 0.9)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Button sx={{ borderRadius: '100px' }}>
                        <img
                            alt="logo-cyc-navbar"
                            style={{ cursor: 'pointer' }}
                            width={110}
                            height={56}
                            src={companyLogo}
                            onClick={() => navigate('/logged/home')}
                        />
                    </Button>
                    <CustomNavLink to="/logged/about">
                        Sobre Nosotros
                    </CustomNavLink>
                    <CustomNavLink to="/logged/blog">Blog</CustomNavLink>
                    <CustomNavLink to="/logged/sgc">
                        Gestión Documental
                    </CustomNavLink>
                    <CustomNavLink to="/logged/vacancies">
                        Vacantes
                    </CustomNavLink>
                    {operationalRiskPermission ? (
                        <CustomNavLink to="/logged/risk-events">
                            Eventos de Riesgo
                        </CustomNavLink>
                    ) : null}
                    {servicesPermission ? (
                        <Button
                            id="button-utils"
                            endIcon={
                                anchorElUtils ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )
                            }
                            onClick={handleUtilitariosMenuOpen}
                            anchorel={anchorElUtils}
                            aria-controls={
                                openUtils ? 'account-menu-utils' : undefined
                            }
                            aria-haspopup="true"
                            aria-expanded={openUtils ? 'true' : undefined}
                            sx={{
                                minWidth: 100,
                                textAlign: 'center',
                                cursor: 'pointer',
                                borderBottom: '2px solid transparent', // Add a transparent bottom border
                                transition: 'all 0.3s ease',
                                padding: '1.5rem 1rem', // Adjust padding to keep text aligned with the container
                                borderBottomColor: 'transparent',
                                color: 'inherit',
                                '&:hover': {
                                    color: '#0076A8',
                                    borderBottomColor: '#0076A8', // Change the background color on hover
                                },
                            }}
                        >
                            Servicios
                        </Button>
                    ) : null}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '2rem',
                        }}
                    >
                        <Tooltip title="Mis Notificaciones">
                            {/* badgeContent state based on if any notification have its read property in 0 */}
                            <Badge
                                badgeContent={
                                    notifications.filter(
                                        (notification) => !notification.read
                                    ).length
                                }
                                color="primary"
                                overlap="circular"
                            >
                                <IconButton
                                    onClick={handleOpenNotification}
                                    size="small"
                                    sx={{ ml: 2 }}
                                    aria-controls={
                                        openNotification
                                            ? 'notification-menu'
                                            : undefined
                                    }
                                    aria-haspopup="true"
                                    aria-expanded={
                                        openNotification ? 'true' : undefined
                                    }
                                >
                                    <NotificationsIcon
                                        sx={{ width: 30, height: 30 }}
                                    />
                                </IconButton>
                            </Badge>
                        </Tooltip>
                        <Tooltip title="Mi Cuenta">
                            <IconButton
                                onClick={handleClick}
                                size="small"
                                sx={{ ml: 2 }}
                                aria-controls={
                                    open ? 'account-menu' : undefined
                                }
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                            >
                                <Avatar sx={{ width: 32, height: 32 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default Navbar;
