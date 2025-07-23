import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router';

// Icons
import FlagIcon from '@mui/icons-material/Flag';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import PolicyIcon from '@mui/icons-material/Policy';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import FmdBadIcon from '@mui/icons-material/FmdBad';
import PaymentsIcon from '@mui/icons-material/Payments';
import TopicIcon from '@mui/icons-material/Topic';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

const MenuServices = ({ anchorElUtils, openUtils, setAnchorElUtils }) => {
    const navigate = useNavigate();
    const permissions = JSON.parse(localStorage.getItem('permissions'));
    const rank = JSON.parse(localStorage.getItem('rango'));
    const cedula = JSON.parse(localStorage.getItem('cedula'));

    const handleCloseUtils = () => {
        setAnchorElUtils(null);
    };

    return (
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
            {/* Commented out because it's not used */}
            {/* {permissions && permissions.includes('goals.view_goals') ? (
                <MenuItem onClick={() => navigate('/logged/goals-stats')}>
                    <ListItemIcon>
                        <FlagIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Análisis de Metas" />
                </MenuItem>
            ) : null} */}
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
            {permissions && permissions.includes('contracts.view_contract') ? (
                <MenuItem onClick={() => navigate('/logged/legal')}>
                    <ListItemIcon>
                        <PolicyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Contratos y Pólizas Legales" />
                </MenuItem>
            ) : null}
            {permissions && permissions.includes('vacancy.view_reference') ? (
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
            {rank > 1 || cedula == 1022445201 ? (
                <MenuItem onClick={() => navigate('/logged/vacations')}>
                    <ListItemIcon>
                        <BeachAccessIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Registros de vacaciones" />
                </MenuItem>
            ) : null}
        </Menu>
    );
};

export default MenuServices;
