import { Outlet } from 'react-router';
import NavBar from '@components/common/NavBar';
import Footer from '@components/common/Footer';
import Box from '@mui/material/Box';

const Root = () => {
    return (
        <Box
            style={{
                display: 'grid',
                minHeight: '100dvh',
                gridTemplateRows: 'auto 1fr auto',
            }}
        >
            <NavBar />
            {/* Ensure the Outlet occupies at least the available space */}
            <Box
                style={{
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
};

export default Root;
