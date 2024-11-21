// Libraries
import { Outlet } from 'react-router-dom';

// Custom Components
import NavBar from '../common/NavBar';
import Footer from '../common/Footer';

// MUI
import Box from '@mui/material/Box';

const Root = () => {
    return (
        <Box
            style={{
                display: 'grid',
                minHeight: '    ',
                gridTemplateRows: 'auto 1fr auto',
            }}
        >
            <NavBar />
            <Outlet />
            <Footer />
        </Box>
    );
};

export default Root;
