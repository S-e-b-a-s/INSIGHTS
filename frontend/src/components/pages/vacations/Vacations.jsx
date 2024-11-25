import { useState, useEffect, useRef } from 'react';

// MUI
import {
    Container,
    Box,
    Button,
    Typography,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Chip,
    Collapse,
} from '@mui/material';

// MUI Data Grid
import {
    DataGrid,
    gridClasses,
    GridActionsCellItem,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridToolbarContainer,
    GridToolbarQuickFilter,
} from '@mui/x-data-grid';

// MUI Lab
import { LoadingButton } from '@mui/lab';

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext.jsx';
import { useProgressbar } from '@contexts/ProgressbarContext.jsx';

// Custom Components
import { getApiUrl } from '@assets/getApi.js';
import { handleError } from '@assets/handleError.js';
import VacationsRequest from './VacationsRequest.jsx';
import {
    CustomNoResultsOverlay,
    CustomNoRowsOverlay,
} from '@assets/CustomDataGridOverlays.jsx';

// Icons
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import EventBusyIcon from '@mui/icons-material/EventBusy';

export const Vacations = () => {
    const { showSnack } = useSnackbar();
    const [rows, setRows] = useState([]);
    const permissions = JSON.parse(localStorage.getItem('permissions'));
    const [openVacation, setOpenVacation] = useState(false);
    const [loadingRows, setLoadingRows] = useState(false);
    const [openDialogPayslip, setOpenDialogPayslip] = useState(false);
    const [vacationId, setVacationId] = useState();
    const [openObservationsInput, setOpenObservationsInput] = useState(false);
    const observationsRef = useRef();
    const cargo = localStorage.getItem('cargo');
    const rank = JSON.parse(localStorage.getItem('rango'));
    const cedula = JSON.parse(localStorage.getItem('cedula'));
    const bossApprovalPermission = rank > 1;
    const managerApprovalPermission =
        cargo.includes('GERENTE') || cedula === '1022370826';
    const hrApprovalPermission = cargo === `"GERENTE DE GESTION HUMANA"`;
    const payrollApprovalPermission = permissions.includes(
        'vacation.payroll_approval'
    );
    const [buttonType, setButtonType] = useState('button');
    const [approvalType, setApprovalType] = useState('');

    const { isProgressVisible, showProgressbar, hideProgressbar } =
        useProgressbar();

    const getVacations = async () => {
        setLoadingRows(true);
        try {
            const response = await fetch(`${getApiUrl().apiUrl}vacation/`, {
                method: 'GET',
                credentials: 'include',
            });

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                setRows(data);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        } finally {
            setLoadingRows(false);
        }
    };

    useEffect(() => {
        getVacations();
    }, []);

    const handleApproval = async (event) => {
        event.preventDefault();
        showProgressbar();

        const formData = new FormData();

        if (buttonType === 'submit') {
            formData.append(approvalType, 0);
            formData.append('comment', observationsRef.current.value);
        } else {
            formData.append(approvalType, 1);
        }

        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}vacation/${vacationId}/`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    body: formData,
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                getVacations();
                showSnack('success', 'Solicitud de vacaciones actualizada');
                handleCloseDialogPayslip();
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        } finally {
            hideProgressbar();
        }
    };

    const columns = [
        {
            field: 'start_date',
            headerName: 'Fecha inicio',
            width: 110,
            type: 'date',
            valueGetter: (value) => {
                if (value) {
                    const date = new Date(value + 'T00:00:00');
                    return date;
                } else {
                    return '';
                }
            },
        },
        {
            field: 'end_date',
            headerName: 'Fecha fin',
            type: 'date',
            width: 110,
            valueGetter: (value) => {
                if (value) {
                    const date = new Date(value + 'T00:00:00');
                    return date;
                } else {
                    return '';
                }
            },
        },
        {
            field: 'created_at',
            headerName: 'Fecha de solicitud',
            width: 150,
            type: 'date',
            valueGetter: (value) => {
                if (value) {
                    let dateWithoutTime = value.split('T')[0];
                    const date = new Date(dateWithoutTime + 'T00:00:00');
                    return date;
                } else {
                    return '';
                }
            },
        },
        {
            field: 'username',
            headerName: 'Solicitado por',
            width: 250,
        },
        {
            field: 'boss_is_approved',
            headerName: 'Aprobación Jefe',
            width: 160,
            type: 'singleSelect',
            valueOptions: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
            // return a chip with the status
            valueGetter: (value) => {
                if (value === null) {
                    return 'PENDIENTE';
                } else if (value === true) {
                    return 'APROBADA';
                }
                return 'RECHAZADA';
            },
            renderCell: (params) => {
                if (params.value === 'PENDIENTE') {
                    return (
                        <Chip
                            onClick={
                                bossApprovalPermission
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'boss_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<PendingIcon />}
                            label="Pendiente"
                        />
                    );
                } else if (params.value === 'APROBADA') {
                    return (
                        <Chip
                            onClick={
                                bossApprovalPermission
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'boss_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<CheckCircleIcon />}
                            label="Aprobada"
                            color="success"
                        />
                    );
                }
                return (
                    <Chip
                        onClick={
                            bossApprovalPermission
                                ? () =>
                                      handleVacancyApproval(
                                          params.id,
                                          'boss_is_approved'
                                      )
                                : undefined
                        }
                        icon={<CancelIcon />}
                        label="Rechazado"
                        color="error"
                    />
                );
            },
        },
        {
            field: 'manager_is_approved',
            headerName: 'Aprobación gerente',
            width: 160,
            type: 'singleSelect',
            valueOptions: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
            // return a chip with the status
            valueGetter: (value) => {
                if (value === null) {
                    return 'PENDIENTE';
                } else if (value === true) {
                    return 'APROBADA';
                }
                return 'RECHAZADA';
            },
            renderCell: (params) => {
                if (params.value === 'PENDIENTE') {
                    return (
                        <Chip
                            onClick={
                                managerApprovalPermission &&
                                params.row.boss_is_approved === true
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'manager_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<PendingIcon />}
                            label="Pendiente"
                        />
                    );
                } else if (params.value === 'APROBADA') {
                    return (
                        <Chip
                            onClick={
                                managerApprovalPermission &&
                                params.row.boss_is_approved === true
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'manager_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<CheckCircleIcon />}
                            label="Aprobada"
                            color="success"
                        />
                    );
                }
                return (
                    <Chip
                        onClick={
                            managerApprovalPermission &&
                            params.row.boss_is_approved === true
                                ? () =>
                                      handleVacancyApproval(
                                          params.id,
                                          'manager_is_approved'
                                      )
                                : undefined
                        }
                        icon={<CancelIcon />}
                        label="Rechazado"
                        color="error"
                    />
                );
            },
        },
        {
            field: 'hr_is_approved',
            headerName: 'Aprobación RH',
            width: 150,
            type: 'singleSelect',
            valueOptions: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
            // return a chip with the status
            valueGetter: (value) => {
                if (value === null) {
                    return 'PENDIENTE';
                } else if (value === true) {
                    return 'APROBADA';
                }
                return 'RECHAZADA';
            },
            renderCell: (params) => {
                if (params.value === 'PENDIENTE') {
                    return (
                        <Chip
                            onClick={
                                params.row.manager_is_approved === true &&
                                hrApprovalPermission
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'hr_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<PendingIcon />}
                            label="Pendiente"
                        />
                    );
                } else if (params.value === 'APROBADA') {
                    return (
                        <Chip
                            onClick={
                                hrApprovalPermission
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'hr_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<CheckCircleIcon />}
                            label="Aprobada"
                            color="success"
                        />
                    );
                }
                return (
                    <Chip
                        onClick={
                            params.row.manager_is_approved === true &&
                            hrApprovalPermission
                                ? () =>
                                      handleVacancyApproval(
                                          params.id,
                                          'hr_is_approved'
                                      )
                                : undefined
                        }
                        icon={<CancelIcon />}
                        label="Rechazada"
                        color="error"
                    />
                );
            },
        },
        {
            field: 'payroll_is_approved',
            headerName: 'Aprobación nomina',
            width: 160,
            type: 'singleSelect',
            valueOptions: ['PENDIENTE', 'APROBADA', 'RECHAZADA'],
            // return a chip with the status
            valueGetter: (value) => {
                if (value === null) {
                    return 'PENDIENTE';
                } else if (value === true) {
                    return 'APROBADA';
                }
                return 'RECHAZADA';
            },
            renderCell: (params) => {
                if (params.value === 'PENDIENTE') {
                    return (
                        <Chip
                            onClick={
                                params.row.hr_is_approved === true &&
                                payrollApprovalPermission
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'payroll_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<PendingIcon />}
                            label="Pendiente"
                        />
                    );
                } else if (params.value === 'APROBADA') {
                    return (
                        <Chip
                            onClick={
                                params.row.hr_is_approved === true &&
                                payrollApprovalPermission
                                    ? () =>
                                          handleVacancyApproval(
                                              params.id,
                                              'payroll_is_approved'
                                          )
                                    : undefined
                            }
                            icon={<CheckCircleIcon />}
                            label="Aprobada"
                            color="success"
                        />
                    );
                }
                return (
                    <Chip
                        onClick={
                            params.row.hr_is_approved === true &&
                            payrollApprovalPermission
                                ? () =>
                                      handleVacancyApproval(
                                          params.id,
                                          'payroll_is_approved'
                                      )
                                : undefined
                        }
                        icon={<CancelIcon />}
                        label="Rechazada"
                        color="error"
                    />
                );
            },
        },

        {
            field: 'comment',
            headerName: 'Observaciones',
            width: 150,
        },
        {
            field: 'status',
            headerName: 'Estado de solicitud',
            width: 150,
            type: 'singleSelect',
            valueOptions: ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'],
            // return a chip with the status
            renderCell: (params) => {
                if (params.value === 'PENDIENTE') {
                    return <Chip icon={<PendingIcon />} label="Pendiente" />;
                } else if (params.value === 'APROBADA') {
                    return (
                        <Chip
                            icon={<CheckCircleIcon />}
                            label="Aprobada"
                            color="success"
                        />
                    );
                } else if (params.value === 'RECHAZADA') {
                    return (
                        <Chip
                            icon={<CancelIcon />}
                            label="Rechazada"
                            color="error"
                        />
                    );
                }
                return (
                    <Chip
                        icon={<EventBusyIcon />}
                        label="Cancelado"
                        color="warning"
                    />
                );
            },
        },
        {
            field: 'request_letter',
            headerName: 'Carta de solicitud',
            width: 150,
            type: 'actions',
            cellClassName: 'actions',
            getActions: ({ row }) => {
                return [
                    <Tooltip
                        key={`tooltip-${row.id}`}
                        title="Ver carta de solicitud de vacaciones"
                        arrow
                    >
                        <GridActionsCellItem
                            key={`open-request-letter-${row.id}`}
                            icon={<FileOpenIcon />}
                            label="open-request-letter"
                            sx={{
                                color: 'primary.main',
                            }}
                            onClick={() => {
                                window.open(
                                    `${getApiUrl().apiUrl}vacation/${row.id}/get-request`,
                                    '_blank'
                                );
                            }}
                        />
                    </Tooltip>,
                ];
            },
        },
        {
            field: 'response_letter',
            headerName: 'Carta de respuesta',
            width: 150,
            type: 'actions',
            cellClassName: 'actions',
            getActions: ({ row }) => {
                return [
                    <Tooltip key={`tooltip-${row.id}`} arrow>
                        <span>
                            <GridActionsCellItem
                                title="Ver carta de respuesta de vacaciones"
                                key={`open-response-letter-${row.id}`}
                                icon={<FileOpenIcon />}
                                disabled={row.status === 'PENDIENTE'}
                                label="open-response-letter"
                                sx={{
                                    color: 'primary.main',
                                }}
                                onClick={() => {
                                    window.open(
                                        `${getApiUrl().apiUrl}vacation/${row.id}/get-response`,
                                        '_blank'
                                    );
                                }}
                            />
                        </span>
                    </Tooltip>,
                ];
            },
        },
    ];

    const handleOpenDialog = () => setOpenVacation(true);

    const CustomToolbar = () => {
        return (
            <GridToolbarContainer>
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
                <GridToolbarExport
                    csvOptions={{
                        fileName: 'registro-desprendibles',
                        delimiter: ';',
                        utf8WithBom: true,
                    }}
                />

                <Button
                    size="small"
                    onClick={handleOpenDialog}
                    startIcon={<BeachAccessIcon />}
                >
                    Crear solicitud
                </Button>
                <Box sx={{ textAlign: 'end', flex: '1' }}>
                    <GridToolbarQuickFilter />
                </Box>
            </GridToolbarContainer>
        );
    };

    const handleCloseDialogPayslip = () => {
        setOpenDialogPayslip(false);
        setOpenObservationsInput(false);
        setButtonType('button');
    };

    const handleDecline = async () => {
        setOpenObservationsInput(true);
        setButtonType('submit');
    };

    const handleVacancyApproval = (id, approvalType) => {
        setOpenDialogPayslip(true);
        setVacationId(id);
        setApprovalType(approvalType);
    };

    return (
        <>
            <VacationsRequest
                getVacations={getVacations}
                openVacation={openVacation}
                setOpenVacation={setOpenVacation}
            />

            <Dialog
                open={openDialogPayslip}
                onClose={handleCloseDialogPayslip}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {'¿ Aprobar solicitud de vacaciones?'}
                </DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">
                        Si aprueba la solicitud de vacaciones, el empleado será
                        notificado y se continuara con el proceso de aprobación
                        de la solicitud.
                    </Typography>
                    <Box component="form" onSubmit={handleApproval}>
                        <Collapse in={openObservationsInput}>
                            <TextField
                                inputRef={observationsRef}
                                sx={{ my: '1rem' }}
                                required={buttonType === 'submit'}
                                disabled={isProgressVisible}
                                variant="filled"
                                fullWidth
                                id="outlined-multiline-flexible"
                                label="Observaciones"
                                multiline
                                maxRows={4}
                            />
                        </Collapse>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mt: '1rem',
                            }}
                        >
                            <Button
                                disabled={isProgressVisible}
                                variant="contained"
                                onClick={handleCloseDialogPayslip}
                                color="primary"
                            >
                                Cancelar
                            </Button>
                            <Box sx={{ display: 'flex', gap: '1rem' }}>
                                <Collapse in={buttonType === 'button'}>
                                    <Button
                                        onClick={handleDecline}
                                        type={buttonType}
                                        disabled={isProgressVisible}
                                        variant="contained"
                                        color="error"
                                    >
                                        Rechazar
                                    </Button>
                                </Collapse>
                                <LoadingButton
                                    type="submit"
                                    loading={isProgressVisible}
                                    variant="contained"
                                    color={
                                        buttonType === 'submit'
                                            ? 'error'
                                            : 'primary'
                                    }
                                >
                                    {buttonType === 'submit'
                                        ? 'Rechazar'
                                        : 'Aprobar'}
                                </LoadingButton>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
            <Container
                sx={{
                    marginTop: '2rem',
                }}
            >
                <Typography
                    sx={{
                        textAlign: 'center',
                        pb: '15px',
                        color: 'primary.main',
                    }}
                    variant={'h4'}
                >
                    Registro de vacaciones
                </Typography>
                <Box sx={{ height: '80vh' }}>
                    <DataGrid
                        loading={loadingRows}
                        getRowHeight={() => 'auto'}
                        initialState={{
                            sorting: {
                                sortModel: [
                                    { field: 'created_at', sort: 'desc' },
                                ],
                            },
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
                        sx={{
                            boxShadow: '0px 0px 5px 0px #e0e0e0',
                            borderRadius: '10px',
                            [`& .${gridClasses.cell}`]: {
                                py: 1,
                            },
                        }}
                        columns={columns}
                        rows={rows}
                    ></DataGrid>
                </Box>
            </Container>
        </>
    );
};

export default Vacations;
