import {
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Avatar,
} from '@mui/material';

import { useNavigate } from 'react-router-dom';

// Icons
import FlagIcon from '@mui/icons-material/Flag';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import EmailIcon from '@mui/icons-material/Email';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import Logout from '@mui/icons-material/Logout';

const MenuAccount = ({
    open,
    anchorEl,
    setAnchorEl,
    setOpenAccountDialog,
    setOpenCertification,
    handleLogout,
    setOpenDialog,
}) => {
    const navigate = useNavigate();
    const rank = JSON.parse(localStorage.getItem('rango'));
    const cargoItem = localStorage.getItem('cargo');
    const isAdvisor = cargoItem && JSON.parse(cargoItem).includes('ASESOR');

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleOpenAccountDialog = () => {
        setOpenAccountDialog(true);
    };

    const handleOpenCertification = () => {
        setOpenCertification(true);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    return (
        <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
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
            <MenuItem onClick={handleOpenAccountDialog}>
                <ListItemIcon>
                    <Avatar />
                </ListItemIcon>
                <ListItemText primary="Mi Cuenta" />
                <Divider />
            </MenuItem>
            {isAdvisor ? (
                <MenuItem onClick={handleOpenDialog}>
                    <ListItemIcon>
                        <FlagIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Mis Metas" />
                </MenuItem>
            ) : null}
            <MenuItem onClick={() => navigate('/logged/my-payslips')}>
                <ListItemIcon>
                    <ReceiptIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Mis desprendibles de nomina" />
            </MenuItem>
            <MenuItem onClick={handleOpenCertification}>
                <ListItemIcon>
                    <DescriptionIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Certificación Laboral" />
            </MenuItem>
            {rank === 1 ? (
                <MenuItem onClick={() => navigate('/logged/vacations')}>
                    <ListItemIcon>
                        <BeachAccessIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Mis Vacaciones" />
                </MenuItem>
            ) : null}
            <MenuItem onClick={() => navigate('/logged/points')}>
                <ListItemIcon>
                    <SportsScoreIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Puntos C&C" />
            </MenuItem>
            <MenuItem onClick={() => navigate('/logged/pqrs')}>
                <ListItemIcon>
                    <EmailIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="PQRS" />
            </MenuItem>
            <MenuItem onClick={() => navigate('/logged/coexistence-committee')}>
                <ListItemIcon>
                    <VolunteerActivismIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Comité de convivencia" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                    <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Cerrar sesión" />
            </MenuItem>
        </Menu>
    );
};

export default MenuAccount;
