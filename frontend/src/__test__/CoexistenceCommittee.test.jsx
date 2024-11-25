import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CoexistenceCommittee from '@components/pages/CoexistenceCommittee';
import { SnackbarProvider } from '@components/context/SnackbarContext';
import { ProgressbarProvider } from '@components/context/ProgressbarContext';

// Mock the fetch function and the custom hooks
global.fetch = vi.fn(() =>
    Promise.resolve({
        status: 201,
        json: () => Promise.resolve({}),
    })
);

const mockShowSnack = vi.fn();
const mockShowProgressbar = vi.fn();
const mockHideProgressbar = vi.fn();

vi.mock('@components/context/SnackbarContext', () => ({
    useSnackbar: () => ({ showSnack: mockShowSnack }),
}));

vi.mock('@components/context/ProgressbarContext', () => ({
    useProgressbar: () => ({
        isProgressVisible: false,
        showProgressbar: mockShowProgressbar,
        hideProgressbar: mockHideProgressbar,
    }),
}));

describe('CoexistenceCommittee component', () => {
    it('renders the form correctly', () => {
        render(
            <SnackbarProvider>
                <ProgressbarProvider>
                    <CoexistenceCommittee />
                </ProgressbarProvider>
            </SnackbarProvider>
        );

        // Check if the form fields are rendered
        expect(screen.getByLabelText('Motivo')).toBeInTheDocument();
        expect(
            screen.getByLabelText('Deja tu mensaje aquí')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Enviar/i })
        ).toBeInTheDocument();
    });

    it('displays validation errors when fields are empty', async () => {
        render(
            <SnackbarProvider>
                <ProgressbarProvider>
                    <CoexistenceCommittee />
                </ProgressbarProvider>
            </SnackbarProvider>
        );

        const submitButton = screen.getByRole('button', { name: /Enviar/i });

        // Click submit without filling the form
        fireEvent.click(submitButton);

        // Wait for validation errors to appear
        await waitFor(() => {
            const errors = screen.getAllByText('Campo requerido');
            expect(errors).toHaveLength(2);
        });
    });

    it('submits the form correctly when fields are filled', async () => {
        render(
            <SnackbarProvider>
                <ProgressbarProvider>
                    <CoexistenceCommittee />
                </ProgressbarProvider>
            </SnackbarProvider>
        );

        const [motivoInput] = screen.getAllByRole('textbox');
        // Fill out the form
        fireEvent.change(motivoInput, {
            target: { value: 'Acoso laboral' },
        });
        fireEvent.change(screen.getByLabelText('Deja tu mensaje aquí'), {
            target: { value: 'Test description' },
        });

        const submitButton = screen.getByRole('button', { name: /Enviar/i });

        // Submit the form
        fireEvent.click(submitButton);

        // Wait for form submission and expect a success message
        await waitFor(() => {
            expect(mockShowSnack).toHaveBeenCalledWith(
                'success',
                'Mensaje enviado correctamente'
            );
        });

        expect(mockShowProgressbar).toHaveBeenCalled();
        expect(mockHideProgressbar).toHaveBeenCalled();
    });

    it('handles submission error correctly', async () => {
        // Mock fetch to return an error response
        global.fetch = vi.fn(() =>
            Promise.resolve({
                status: 400,
                json: () => Promise.resolve({ message: 'Error message' }),
            })
        );

        render(
            <SnackbarProvider>
                <ProgressbarProvider>
                    <CoexistenceCommittee />
                </ProgressbarProvider>
            </SnackbarProvider>
        );

        const [motivoInput] = screen.getAllByRole('textbox');
        // Fill out the form
        fireEvent.change(motivoInput, {
            target: { value: 'Acoso laboral' },
        });

        fireEvent.change(screen.getByLabelText('Deja tu mensaje aquí'), {
            target: { value: 'Test description' },
        });

        const submitButton = screen.getByRole('button', { name: /Enviar/i });

        // Submit the form
        fireEvent.click(submitButton);

        // Wait for error handling
        await waitFor(() => {
            expect(mockShowSnack).toHaveBeenCalledWith(
                'error',
                'Error message'
            );
        });

        expect(mockShowProgressbar).toHaveBeenCalled();
        expect(mockHideProgressbar).toHaveBeenCalled();
    });
});
