import React, { createContext, useState, useContext } from 'react';
import { Fade, LinearProgress } from '@mui/material';

// Create ProgressBar context
const ProgressbarContext = createContext();

// ProgressBarProvider component
export const ProgressbarProvider = ({ children }) => {
    const [isProgressVisible, setIsProgressVisible] = useState(false);

    const showProgressbar = () => {
        setIsProgressVisible(true);
    };

    const hideProgressbar = () => {
        setIsProgressVisible(false);
    };

    return (
        <ProgressbarContext.Provider
            value={{ isProgressVisible, showProgressbar, hideProgressbar }}
        >
            {children}
            <Fade in={isProgressVisible}>
                <LinearProgress
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        zIndex: 1301,
                    }}
                    variant="query"
                />
            </Fade>
        </ProgressbarContext.Provider>
    );
};

// Custom hook to use the ProgressBar context
export const useProgressbar = () => useContext(ProgressbarContext);
