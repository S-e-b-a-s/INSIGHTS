import { useState, useEffect } from 'react';

// Libraries
import {
    Container,
    Box,
    Typography,
    TextField,
    MenuItem,
    Alert,
} from '@mui/material';
import { Formik, Form, useField } from 'formik';
import * as Yup from 'yup';
import { LoadingButton } from '@mui/lab';

// Icons
import SendIcon from '@mui/icons-material/Send';

// Custom Components/Functions
import { getApiUrl } from '@assets/getApi';
import { handleError } from '@assets/handleError';

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext';
import { useProgressbar } from '@contexts/ProgressbarContext';

// Media
const PqrsImage = `${getApiUrl().apiUrl}static/images/pqrs/pqrs.webp`;

const reasons = [
    { value: 'PETICIÓN', label: 'Petición' },
    { value: 'QUEJA', label: 'Queja' },
    { value: 'RECLAMO', label: 'Reclamo' },
    { value: 'SUGERENCIA', label: 'Sugerencia' },
    { value: 'OTRO', label: 'Otro' },
];

const validationSchema = Yup.object().shape({
    management: Yup.string().required('Campo requerido'),
    reason: Yup.string().required('Campo requerido'),
    description: Yup.string().required('Campo requerido'),
});

const Pqrs = () => {
    const [managements, setManagements] = useState([]);
    const { showSnack } = useSnackbar();
    const { isProgressVisible, showProgressbar, hideProgressbar } =
        useProgressbar();

    const getManagement = async () => {
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}pqrs/management/`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );

            await handleError(response, showSnack);
            if (response.status === 200) {
                const data = await response.json();
                let managements = data.map((management) => ({
                    value: management.id,
                    label: management.area,
                }));
                setManagements(managements);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        getManagement();
    }, []);

    const handleSubmit = async (values, { resetForm }) => {
        showProgressbar();

        try {
            const response = await fetch(`${getApiUrl().apiUrl}pqrs/pqrs/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
                credentials: 'include',
            });
            await handleError(response, showSnack);
            if (response.status === 201) {
                showSnack('success', 'Mensaje enviado correctamente');
                resetForm();
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        } finally {
            hideProgressbar(false);
        }
    };

    const FormikTextField = ({
        type,
        label,
        options,
        multiline,
        rows,
        width = '100%', // Default width
        ...props
    }) => {
        const [field, meta] = useField(props);
        const errorText = meta.error && meta.touched ? meta.error : '';

        return (
            <TextField
                sx={{ width }}
                select={type === 'select'}
                multiline={multiline}
                rows={rows}
                type={type}
                label={label}
                {...field}
                helperText={errorText}
                error={!!errorText}
            >
                {type === 'select' &&
                    options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
            </TextField>
        );
    };

    return (
        <Container sx={{ my: '2rem' }}>
            <img
                src={PqrsImage}
                alt="Coexistence Committee"
                style={{
                    width: '70%',
                    height: 'auto',
                    display: 'block',
                    margin: 'auto',
                }}
            />
            <Box sx={{ pb: '1rem' }}>
                <Typography
                    variant="h4"
                    sx={{ textAlign: 'center', pb: 2, color: 'primary.main' }}
                >
                    PQRS
                </Typography>
                <Typography variant="body1">
                    En esta sección puedes enviar un mensaje a las distintas
                    Gerencias de la Compañía según tus intereses. Tienes la
                    opción de expresar de manera respetuosa tus inconformidades,
                    inconvenientes, sugerencias o felicitaciones, dirigiendo el
                    mensaje a la Gerencia correspondiente.
                    <br />
                    <br />
                    Ten en cuenta que el contenido de tu mensaje será
                    confidencial y únicamente lo conocerán tú y el Gerente del
                    área seleccionada. Te recomendamos redactar de forma clara,
                    con prudencia y buena ortografía para asegurar que tu
                    mensaje sea fácilmente comprensible.
                </Typography>

                <Alert severity="info" sx={{ mt: '1rem' }}>
                    <Typography variant="body1">
                        Ten en cuenta que tus datos de contacto serán enviados a
                        la Gerencia correspondiente para que puedan responder a
                        tu mensaje. Si deseas mantener tu mensaje anónimo y
                        corresponde a una de las categorías del módulo de línea
                        ética, por favor haz tu solicitud por ese medio.
                        Recuerda que para acceder al módulo de línea ética
                        tienes que cerrar sesión e ingresar por el botón de
                        línea ética en el inicio de sesión de la intranet.
                    </Typography>
                </Alert>
            </Box>

            <Formik
                initialValues={{ management: '', reason: '', description: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        <FormikTextField
                            type="select"
                            options={managements}
                            name="management"
                            label="Área"
                            autoComplete="off"
                        />
                        <FormikTextField
                            type="select"
                            options={reasons}
                            name="reason"
                            label="Motivo"
                            autoComplete="off"
                        />
                        <FormikTextField
                            type="text"
                            multiline
                            rows={8}
                            name="description"
                            label="Deja tu mensaje aquí"
                            autoComplete="off"
                        />
                        <LoadingButton
                            loading={isProgressVisible}
                            type="submit"
                            sx={{ width: 'max-content' }}
                            variant="outlined"
                            endIcon={<SendIcon />}
                        >
                            Enviar
                        </LoadingButton>
                    </Box>
                </Form>
            </Formik>
        </Container>
    );
};

export default Pqrs;
