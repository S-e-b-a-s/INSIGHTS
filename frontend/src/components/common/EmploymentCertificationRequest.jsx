import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Collapse,
    TextField,
    MenuItem,
    Typography,
    Button,
    Alert,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { getApiUrl } from '@assets/getApi';
import { handleError } from '@assets/handleError';
import { useProgressbar } from '@contexts/ProgressbarContext';

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext';

const EmploymentCertificationRequest = ({
    openCertification,
    setOpenCertification,
}) => {
    const [checked, setChecked] = useState(false);
    const [openCollapseBonuses, setOpenCollapseBonuses] = useState(false);
    const [openCollapseEmail, setOpenCollapseEmail] = useState(false);
    const currentEmail = JSON.parse(localStorage.getItem('email'));
    const { isProgressVisible, showProgressbar, hideProgressbar } =
        useProgressbar();
    const { showSnack } = useSnackbar();
    const bonusesInput = useRef(null);

    const handleChangeCheck = (event) => {
        setChecked(event.target.checked);
        setOpenCollapseBonuses(event.target.checked);
    };

    const handleOpenCollapseEmail = () => {
        setOpenCollapseEmail(true);
    };

    const sendCertification = async () => {
        showProgressbar();
        let body = {};

        if (checked) {
            body = {
                months: bonusesInput.current.value,
            };
        }

        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}employment-management/send-employment-certification/`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                setOpenCertification(false);
                showSnack(
                    'success',
                    data.message +
                        ' correctamente al correo ' +
                        data.email.toLowerCase()
                );
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        } finally {
            hideProgressbar();
        }
    };

    const handleCloseCertification = () => {
        setOpenCertification(false);
        setOpenCollapseBonuses(false);
        setChecked(false);
        setOpenCollapseEmail(false);
    };

    return (
        <Dialog
            open={openCertification}
            onClose={handleCloseCertification}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {'¿Enviar Certificación Laboral?'}
            </DialogTitle>
            <DialogContent sx={{ paddingBottom: 0 }}>
                <DialogContentText id="alert-dialog-description">
                    Selecciona si deseas que la certificación se envíe a tu
                    correo, ya sea con o sin bonificaciones, y especifica los
                    meses promediados de estas, si las hubiera.
                </DialogContentText>
                <FormGroup sx={{ mt: '.5rem' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={checked}
                                onChange={handleChangeCheck}
                                inputProps={{ 'aria-label': 'controlled' }}
                            />
                        }
                        label="Incluir bonificaciones"
                    />
                </FormGroup>
                <Collapse sx={{ py: '1rem' }} in={openCollapseBonuses}>
                    <TextField
                        inputRef={bonusesInput}
                        sx={{ width: '100%' }}
                        defaultValue="3"
                        label="Seleccione los meses promediados de bonificaciones"
                        select
                    >
                        <MenuItem value={3}>Últimos 3 meses</MenuItem>
                        <MenuItem value={6}>Últimos 6 meses</MenuItem>
                    </TextField>
                </Collapse>
                <Typography color="text.secondary">
                    La certificación laboral sera enviada al correo electrónico:{' '}
                    <span style={{ fontWeight: 500, color: 'rgb(0,0,0,0.8)' }}>
                        {currentEmail?.toLowerCase()}
                    </span>
                </Typography>
                <Collapse in={!openCollapseEmail}>
                    <Button
                        sx={{ mt: '1rem' }}
                        onClick={handleOpenCollapseEmail}
                    >
                        Ese no es mi correo
                    </Button>
                </Collapse>
                <Collapse in={openCollapseEmail}>
                    <Alert sx={{ mt: '1rem' }} severity="info">
                        Si este no es tu correo electrónico, por favor, ingresa
                        al modulo de mi cuenta y actualiza tu correo
                        electrónico. Recuerda cerrar sesión y volver a iniciar
                        sesión para que los cambios surtan efecto.
                    </Alert>
                </Collapse>
            </DialogContent>
            <DialogActions
                sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
                <Button
                    disabled={isProgressVisible}
                    onClick={handleCloseCertification}
                >
                    Cancelar
                </Button>
                <LoadingButton
                    loading={isProgressVisible}
                    onClick={sendCertification}
                >
                    Enviar
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default EmploymentCertificationRequest;
