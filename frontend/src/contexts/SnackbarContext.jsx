import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

// Create the context
const SnackbarContext = createContext();

// Snackbar Provider component
export const SnackbarProvider = ({ children }) => {
    const [openSnack, setOpenSnack] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('success');

    const showSnack = (severity, message) => {
        setMessage(message);
        setSeverity(severity);
        setOpenSnack(true);
    };

    const closeSnack = () => {
        setOpenSnack(false);
    };

    return (
        <SnackbarContext.Provider value={{ showSnack, closeSnack }}>
            {children}
            <Snackbar
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                open={openSnack}
                onClose={closeSnack}
                autoHideDuration={3000}
            >
                <Alert onClose={closeSnack} severity={severity}>
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

// Custom hook to use the Snackbar context
export const useSnackbar = () => useContext(SnackbarContext);
