import { useState, useEffect } from 'react';

// Libraries
import { Formik, Form, useField } from 'formik';
import * as Yup from 'yup';
// Custom Hooks
import { useSnackbar } from '../context/SnackbarContext';

// Custom Components
import { getApiUrl } from '../../assets/getApi';
import { useNavigate } from 'react-router-dom';
import { handleError } from '../../assets/handleError';
import {
    CustomNoResultsOverlay,
    CustomNoRowsOverlay,
} from '../../assets/CustomDataGridOverlays';

// Material-UI
import {
    Container,
    Typography,
    Box,
    TextField,
    MenuItem,
    Button,
    Card,
} from '@mui/material';

import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarExport,
    GridToolbarDensitySelector,
    GridToolbarQuickFilter,
} from '@mui/x-data-grid';

const validationSchema = Yup.object().shape({
    deliveryType: Yup.string().required('Campo requerido'),
    month: Yup.string().required('Campo requerido'),
    campaign: Yup.string().required('Campo requerido'),
    year: Yup.string().required('Campo requerido'),
});

const FormikTextField = ({
    type,
    label,
    options,
    multiline,
    rows,
    ...props
}) => {
    const [field, meta] = useField(props);
    const errorText = meta.error && meta.touched ? meta.error : '';

    return (
        <TextField
            fullWidth
            select={type === 'select'}
            multiline={multiline}
            rows={rows}
            label={label}
            defaultValue={''}
            {...field}
            error={!!errorText}
            helperText={errorText}
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

const options = [
    { label: 'Banco Agrario', value: 'Banco Agrario' },
    { label: 'Coomeva Cartera', value: 'Coomeva Cartera' },
    { label: 'Coomeva Cem', value: 'Coomeva Cem' },
    { label: 'Coomeva Mp', value: 'Coomeva Mp' },
    { label: 'Falabella', value: 'Falabella' },
    { label: 'Falabella Castigo', value: 'Falabella Castigo' },
    { label: 'Falabella Renegociados', value: 'Falabella Renegociados' },
    { label: 'Metlife-Cafam', value: 'Metlife-Cafam' },
    { label: 'Metlife-Colsubsidio Cupo', value: 'Metlife-Colsubsidio Cupo' },
    {
        label: 'Metlife-Colsubsidio Monetaria',
        value: 'Metlife-Colsubsidio Monetaria',
    },
    { label: 'Metlife-Gmf', value: 'Metlife-Gmf' },
    {
        label: 'Metlife-Serfiananza Stock Apoyo',
        value: 'Metlife-Serfiananza Stock Apoyo',
    },
    {
        label: 'Metlife-Serfinanaza Apoyo Colsubsidio',
        value: 'Metlife-Serfinanaza Apoyo Colsubsidio',
    },
    {
        label: 'Metlife-Serfinanza Bienvenida',
        value: 'Metlife-Serfinanza Bienvenida',
    },
    { label: 'Nueva Eps', value: 'Nueva Eps' },
    { label: 'Sura', value: 'Sura' },
    { label: 'CLARO', value: 'CLARO' },
    { label: 'Metlife', value: 'Metlife' },
    { label: 'No', value: 'No' },
    { label: 'PayU', value: 'PayU' },
    { label: 'Liberty', value: 'Liberty' },
    { label: 'Codensa', value: 'Codensa' },
    { label: 'Credibanco', value: 'Credibanco' },
    { label: 'Scotiabank', value: 'Scotiabank' },
    { label: 'Yanbal', value: 'Yanbal' },
    { label: 'MI BANCO', value: 'MI BANCO' },
    { label: 'PICHINCHA', value: 'PICHINCHA' },
    { label: 'COOMEVA', value: 'COOMEVA' },
    { label: 'CLARO CARTERA', value: 'CLARO CARTERA' },
    { label: 'SCOTIABANK COLPATRIA', value: 'SCOTIABANK COLPATRIA' },
    { label: 'CEM COOMEVA', value: 'CEM COOMEVA' },
    { label: 'CAFAM', value: 'CAFAM' },
    { label: 'CAFAM OJT', value: 'CAFAM OJT' },
    { label: 'COLSUBSIDIO', value: 'COLSUBSIDIO' },
    { label: 'COLSUBSIDIO OJT', value: 'COLSUBSIDIO OJT' },
    { label: 'GMF', value: 'GMF' },
    { label: 'SERFINANZA BIENVENIDA', value: 'SERFINANZA BIENVENIDA' },
    { label: 'SERFINANZA BIENVENIDA OJT', value: 'SERFINANZA BIENVENIDA OJT' },
    { label: 'SERFINANZA STOCK', value: 'SERFINANZA STOCK' },
    { label: 'SERFINANZA STOCK OJT', value: 'SERFINANZA STOCK OJT' },
    { label: 'COLSUBSIDIO PRIMA UNICA', value: 'COLSUBSIDIO PRIMA UNICA' },
    { label: 'Serf. Bienvenida', value: 'Serf. Bienvenida' },
    { label: 'Serf. Stock', value: 'Serf. Stock' },
    { label: 'Affluent', value: 'Affluent' },
    { label: 'Rehabilitacion', value: 'Rehabilitacion' },
    { label: 'Cyc Cartera', value: 'Cyc Cartera' },
    { label: 'Banco Satander', value: 'Banco Satander' },
    { label: 'Minuto De Dios', value: 'Minuto De Dios' },
    { label: 'Nubank', value: 'Nubank' },
    { label: 'Flexfintech', value: 'Flexfintech' },
    { label: 'Banco Finandina', value: 'Banco Finandina' },
    { label: 'Banco Pichincha', value: 'Banco Pichincha' },
    { label: 'Nueva Eps Sc', value: 'Nueva Eps Sc' },
    { label: 'Banco Santander', value: 'Banco Santander' },
    { label: 'Mi Banco', value: 'Mi Banco' },
    { label: 'Minuto de Dios', value: 'Minuto de Dios' },
    { label: 'Banco Santader', value: 'Banco Santader' },
    { label: 'Interactuar', value: 'Interactuar' },
    { label: 'Credintegral', value: 'Credintegral' },
    { label: 'Cuotas Acumuladas', value: 'Cuotas Acumuladas' },
    { label: 'Falabella / Cafam', value: 'Falabella / Cafam' },
    { label: 'Falabella / Stock', value: 'Falabella / Stock' },
];

const initialValues = {
    deliveryType: '',
    month: '',
    campaign: '',
    year: '',
};

const AnalisisMetas = () => {
    const { showSnack } = useSnackbar();
    const [rows, setRows] = useState([]);
    const [goalsQuantity, setGoalsQuantity] = useState([]);
    const [yearsArray, setYearsArray] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const permissions = JSON.parse(localStorage.getItem('permissions'));

    useEffect(() => {
        if (!permissions || !permissions.includes('goals.view_goals')) {
            navigate('/logged/home');
        }
    }, []);

    const YearSelect = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2023; year <= currentYear; year++) {
            years.push({ value: year, label: year });
        }
        setYearsArray(years);
    };

    useEffect(() => {
        YearSelect();
    }, []);

    const fields = [
        {
            id: 'deliveryType',
            label: 'Tipo de meta',
            name: 'deliveryType',
            type: 'select',
            options: [
                { value: 'delivery', label: 'Entrega' },
                { value: 'execution', label: 'Ejecución' },
            ],
        },
        {
            id: 'campaign',
            label: 'Campaña',
            name: 'campaign',
            type: 'select',
            options: options,
        },
        {
            id: 'month',
            label: 'Mes',
            name: 'month',
            type: 'select',
            options: [
                { value: 'ENERO', label: 'ENERO' },
                { value: 'FEBRERO', label: 'FEBRERO' },
                { value: 'MARZO', label: 'MARZO' },
                { value: 'ABRIL', label: 'ABRIL' },
                { value: 'MAYO', label: 'MAYO' },
                { value: 'JUNIO', label: 'JUNIO' },
                { value: 'JULIO', label: 'JULIO' },
                { value: 'AGOSTO', label: 'AGOSTO' },
                { value: 'SEPTIEMBRE', label: 'SEPTIEMBRE' },
                { value: 'OCTUBRE', label: 'OCTUBRE' },
                { value: 'NOVIEMBRE', label: 'NOVIEMBRE' },
                { value: 'DICIEMBRE', label: 'DICIEMBRE' },
            ],
        },
        {
            id: 'year',
            label: 'Año',
            name: 'year',
            type: 'select',
            options: yearsArray,
        },
    ];

    const modifyData = (data) => {
        const modifiedData = data.map((row) => {
            if (row.quantity_goal > 999) {
                const formatter = new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                });
                const value = row.quantity_goal;
                const formattedValue = formatter.format(value);
                row.quantity_goal = formattedValue;
            } else if (row.quantity_goal < 1) {
                row.quantity_goal = Math.round(row.quantity_goal * 100) + '%';
            }
            return {
                ...row,
                accepted:
                    row.accepted == 0
                        ? 'Rechazada'
                        : row.accepted == 1
                          ? 'Aceptada'
                          : 'En espera',
                clean_desk:
                    row.clean_desk === '' ? 'En Espera' : row.clean_desk,
                quality: row.quality === '' ? 'En Espera' : row.quality,
                result: row.result === '' ? 'En Espera' : row.result,
                total: row.total === '' ? 'En Espera' : row.total,
                accepted_execution:
                    row.total == '' && row.accepted_execution == null
                        ? ''
                        : row.accepted_execution == 0
                          ? 'Rechazada'
                          : row.accepted_execution == 1
                            ? 'Aceptada'
                            : 'En espera',
            };
        });

        setRows(modifiedData);
    };

    const constructStats = (data, deliveryType) => {
        const stats = {
            metasCumplidas: 0,
            metasNoCumplidas: 0,
            metasEnEspera: 0,
        };

        data.forEach((row) => {
            let acceptedRow =
                deliveryType === 'delivery' ? 'accepted' : 'accepted_execution';

            if (row[acceptedRow] === true) {
                stats.metasCumplidas++;
            } else if (row[acceptedRow] === false) {
                stats.metasNoCumplidas++;
            } else {
                stats.metasEnEspera++;
            }
        });

        setGoalsQuantity(stats);
    };

    const getCurrentGoals = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}goals/?column=delivery`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                constructStats(data, 'delivery');
                modifyData(data);
                setColumns(currentColumns);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCurrentGoals();
    }, []);

    const currentColumns = [
        { field: 'cedula', headerName: 'Cedula', width: 105 },
        {
            field: 'name',
            headerName: 'Nombre',
            width: 280,
        },
        { field: 'campaign_goal', headerName: 'Campaña', width: 250 },
        {
            field: 'criteria_goal',
            headerName: 'Variable a Medir',
            width: 300,
        },
        { field: 'quantity_goal', headerName: 'Meta', width: 200 },
        { field: 'goal_date', headerName: 'Fecha', width: 240 },
        { field: 'accepted', headerName: 'Aprobación Meta', width: 225 },
    ];

    const goalsColumns = [
        { field: 'cedula', headerName: 'Cedula', width: 105 },
        {
            field: 'name',
            headerName: 'Nombre',
            width: 280,
        },
        { field: 'criteria_goal', headerName: 'Variable a Medir', width: 300 },
        { field: 'quantity_goal', headerName: 'Meta', width: 240 },
        { field: 'accepted', headerName: 'Aprobación Meta', width: 225 },
    ];

    const claroColumns = [
        { field: 'cedula', headerName: 'Cedula', width: 105 },
        {
            field: 'name',
            headerName: 'Nombre',
            width: 280,
        },
        {
            field: 'coordinator_goal',
            headerName: 'Coordinador',
            width: 300,
        },
        {
            field: 'table_goal',
            headerName: 'Franja',
            width: 200,
        },
        { field: 'accepted', headerName: 'Aprobación Meta', width: 225 },
    ];

    const executionColumns = [
        { field: 'cedula', headerName: 'Cedula', width: 100 },
        { field: 'name', headerName: 'Nombre', width: 280 },
        { field: 'quantity_execution', headerName: 'Meta', width: 140 },
        { field: 'clean_desk', headerName: 'Clean Desk', width: 100 },
        { field: 'quality', headerName: 'Calidad', width: 80 },
        { field: 'result', headerName: 'Resultado', width: 100 },
        { field: 'total', headerName: 'Total', width: 80 },
        { field: 'accepted_execution', headerName: 'Aprobación', width: 170 },
    ];

    const [columns, setColumns] = useState(goalsColumns);

    function CustomToolbar() {
        return (
            <GridToolbarContainer>
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
                <GridToolbarExport
                    csvOptions={{
                        fileName: 'Metas',
                        delimiter: ';',
                        utf8WithBom: true,
                    }}
                />
                <Box sx={{ textAlign: 'end', flex: '1' }}>
                    <GridToolbarQuickFilter />
                </Box>
            </GridToolbarContainer>
        );
    }

    const stats = [
        { title: 'Metas Aceptadas', quantity: goalsQuantity.metasCumplidas },
        {
            title: 'Metas No Aceptadas',
            quantity: goalsQuantity.metasNoCumplidas,
        },
        { title: 'Metas en Espera', quantity: goalsQuantity.metasEnEspera },
    ];

    const handleFilter = async (values) => {
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}goals/?date=${values.month}-${values.year}&column=${values.deliveryType}&campaign=${values.campaign}`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                constructStats(data, values.deliveryType);
                const newColumns =
                    values.deliveryType === 'delivery' &&
                    values.campaign === 'claro'
                        ? claroColumns
                        : values.deliveryType === 'delivery'
                          ? goalsColumns
                          : executionColumns;
                if (columns !== newColumns) {
                    setColumns(newColumns);
                }
                modifyData(data);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    return (
        <Container
            maxWidth="xl"
            sx={{
                mt: '6rem',
            }}
        >
            <Typography
                sx={{ textAlign: 'center', pb: '15px', color: 'primary.main' }}
                variant={'h4'}
            >
                Análisis de Metas
            </Typography>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleFilter}
            >
                <Form>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: '1rem',
                            pb: '1rem',
                        }}
                    >
                        {fields.map((field) => (
                            <FormikTextField
                                key={field.id}
                                type={field.type}
                                label={field.label}
                                options={field.options}
                                name={field.name}
                                multiline={field.multiline}
                                rows={field.rows}
                            />
                        ))}
                        <Button variant="outlined" size="small" type="submit">
                            Filtrar
                        </Button>
                    </Box>
                </Form>
            </Formik>
            <Box
                sx={{
                    display: 'flex',
                    height: '70vh',
                    minHeight: '600px',
                    // boxShadow: '0px 0px 5px 0px #e0e0e0',
                    borderRadius: '10px',
                }}
            >
                <DataGrid
                    loading={loading}
                    sx={{ boxShadow: '0px 0px 5px 0px #e0e0e0' }}
                    rows={rows}
                    columns={columns}
                    csvOptions={{
                        fileName: 'Metas',
                        delimiter: ';',
                        utf8WithBom: true,
                    }}
                    slots={{
                        toolbar: CustomToolbar,
                        noResultsOverlay: CustomNoResultsOverlay,
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    slotProps={{
                        loadingOverlay: {
                            variant: 'skeleton',
                            noRowsVariant: 'skeleton',
                        },
                    }}
                    getRowId={(row) => row.cedula}
                />
                <Box
                    sx={{
                        pl: '1rem',
                    }}
                >
                    {stats.map((stat, index) => (
                        <Card sx={{ mb: '1rem' }} key={index}>
                            <Typography
                                sx={{
                                    textAlign: 'center',
                                    p: '1rem',
                                    color: 'primary.main',
                                }}
                                variant={'h6'}
                            >
                                Porcentaje de {stat.title}
                            </Typography>
                            <Typography
                                sx={{
                                    textAlign: 'center',
                                }}
                                variant={'h2'}
                            >
                                {Math.round(
                                    (stat.quantity / rows.length) * 100
                                ) || 0}
                                %
                            </Typography>
                            <Typography
                                sx={{
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                {stat.quantity} de {rows.length} metas
                            </Typography>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Container>
    );
};
export default AnalisisMetas;
