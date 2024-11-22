import { useState, useEffect } from 'react';

// Libraries
import { useNavigate, useMatch } from 'react-router-dom';

// Custom Hooks
import { useSnackbar } from '../../contexts/SnackbarContext';

// Custom Components/Functions
import Goals from '../shared/Goals';
import MyAccountDialog from '../shared/MyAccount';
import InactivityDetector from '../shared/InactivityDetector';
import Notifications from '../shared/Notifications';
import { getApiUrl } from '../../assets/getApi';
import { handleError } from '../../assets/handleError';
import EmploymentCertificationRequest from './EmploymentCertificationRequest';
import MenuAccount from './MenuAccount';

// Material-UI
import {
    Box,
    Button,
    MenuItem,
    Menu,
    Tooltip,
    IconButton,
    Avatar,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
} from '@mui/material';

// Icons
import Logout from '@mui/icons-material/Logout';
import FlagIcon from '@mui/icons-material/Flag';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import PolicyIcon from '@mui/icons-material/Policy';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import FmdBadIcon from '@mui/icons-material/FmdBad';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentsIcon from '@mui/icons-material/Payments';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DescriptionIcon from '@mui/icons-material/Description';
import TopicIcon from '@mui/icons-material/Topic';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import EmailIcon from '@mui/icons-material/Email';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';

// Media
import logotipo from '../../images/cyc-logos/logo-navbar.webp';

const Navbar = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorElUtils, setAnchorElUtils] = useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const openUtils = Boolean(anchorElUtils);
    const [openDialog, setOpenDialog] = useState(false);
    const [openAccountDialog, setOpenAccountDialog] = useState(false);
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

    const handleCloseUtils = () => {
        setAnchorElUtils(null);
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOpenNotification = (event) => {
        setAnchorNotification(event.currentTarget);
    };

    const handleCloseAccountDialog = () => {
        setOpenAccountDialog(false);
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
            {isAdvisor ? (
                <Goals
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    showSnack={showSnack}
                />
            ) : null}
            <MyAccountDialog
                open={openAccountDialog}
                onClose={handleCloseAccountDialog}
            />
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
                setOpenAccountDialog={setOpenAccountDialog}
                isAdvisor={isAdvisor}
                setOpenCertification={setOpenCertification}
                rank={rank}
                handleLogout={handleLogout}
                setOpenDialog={setOpenDialog}
            />

            <Box
                className="navbar"
                sx={{
                    backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={handleCloseUtils}
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
                            height={55}
                            src={logotipo}
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

            <Menu
                anchorEl={anchorElUtils}
                open={openUtils}
                onClick={handleCloseUtils}
                onClose={handleCloseUtils}
                id="account-menu-utils"
                MenuListProps={{
                    'aria-labelledby': 'button-utils',
                }}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {permissions && permissions.includes('goals.view_goals') ? (
                    <MenuItem onClick={() => navigate('/logged/goals-stats')}>
                        <ListItemIcon>
                            <FlagIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Análisis de Metas" />
                    </MenuItem>
                ) : null}
                {permissions &&
                (permissions.includes('users.upload_robinson_list') ||
                    permissions.includes('goals.add_goals') ||
                    permissions.includes('users.upload_points')) ? (
                    <MenuItem onClick={() => navigate('/logged/upload-files')}>
                        <ListItemIcon>
                            <UploadFileIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Cargue de Archivos" />
                    </MenuItem>
                ) : null}
                {permissions &&
                permissions.includes('excels_processing.call_transfer') ? (
                    <MenuItem onClick={() => navigate('/logged/quality')}>
                        <ListItemIcon>
                            <DriveFileMoveIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Trasladar Archivos" />
                    </MenuItem>
                ) : null}
                {permissions &&
                permissions.includes('contracts.view_contract') ? (
                    <MenuItem onClick={() => navigate('/logged/legal')}>
                        <ListItemIcon>
                            <PolicyIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Contratos y Pólizas Legales" />
                    </MenuItem>
                ) : null}
                {permissions &&
                permissions.includes('vacancy.view_reference') ? (
                    <MenuItem
                        onClick={() => navigate('/logged/vacancies-referred')}
                    >
                        <ListItemIcon>
                            <ForwardToInboxIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Vacantes Referidas" />
                    </MenuItem>
                ) : null}
                {permissions &&
                permissions.includes('operational_risk.view_events') ? (
                    <MenuItem onClick={() => navigate('/logged/risk-events')}>
                        <ListItemIcon>
                            <FmdBadIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Eventos de Riesgo Operativo" />
                    </MenuItem>
                ) : null}
                {permissions && permissions.includes('payslip.add_payslip') ? (
                    <MenuItem onClick={() => navigate('/logged/payslips')}>
                        <ListItemIcon>
                            <PaymentsIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Registros de Desprendibles de Nomina" />
                    </MenuItem>
                ) : null}
                {permissions &&
                permissions.includes(
                    'employment_management.view_employmentcertification'
                ) ? (
                    <MenuItem
                        onClick={() =>
                            navigate('/logged/employment-certifications')
                        }
                    >
                        <ListItemIcon>
                            <TopicIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Certificados Laborales" />
                    </MenuItem>
                ) : null}
                {rank > 1 ? (
                    <MenuItem onClick={() => navigate('/logged/vacations')}>
                        <ListItemIcon>
                            <BeachAccessIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Registros de vacaciones" />
                    </MenuItem>
                ) : null}
            </Menu>
        </>
    );
};

export default Navbar;
