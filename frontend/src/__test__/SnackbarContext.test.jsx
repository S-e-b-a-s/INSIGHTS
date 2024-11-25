import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
    SnackbarProvider,
    useSnackbar,
} from '@components/context/SnackbarContext';
import '@testing-library/jest-dom';

// Test component to use the Snackbar context
const TestComponent = () => {
    const { showSnack } = useSnackbar();

    return (
        <button onClick={() => showSnack('success', 'Test message')}>
            Show Snackbar
        </button>
    );
};

describe('SnackbarContext', () => {
    it('should show and hide the snackbar with the correct message and severity', async () => {
        render(
            <SnackbarProvider>
                <TestComponent />
            </SnackbarProvider>
        );

        // Click the button to show the snackbar
        fireEvent.click(screen.getByText('Show Snackbar'));

        // Check if the snackbar is displayed with the correct message and severity
        expect(await screen.findByText('Test message')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveClass(
            'MuiAlert-standardSuccess'
        );

        // Wait for the snackbar to auto-hide
        await waitFor(
            () => {
                expect(
                    screen.queryByText('Test message')
                ).not.toBeInTheDocument();
            },
            { timeout: 4000 }
        );
    });
});
