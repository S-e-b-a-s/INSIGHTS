import { useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Typography, Box, Container, TextField, MenuItem } from '@mui/material';
import clsx from 'clsx';
import {
    CustomNoResultsOverlay,
    CustomNoRowsOverlay,
} from '../../assets/CustomDataGridOverlays';

const columns = [
    { field: 'employeeId', headerName: 'Cedula', width: 100 },
    { field: 'name', headerName: 'Nombre', width: 250 },
    { field: 'campaign', headerName: 'Campaña', width: 250 },
    ...Array.from({ length: 30 }, (_, index) => ({
        field: `day${index + 1}`,
        headerName: `${index + 1}`,
        width: 20,
        type: 'singleSelect',
        valueOptions: [
            'A',
            'T',
            'AF',
            'IPE',
            'ICJ',
            'ISJ',
            'R',
            'V',
            'IM',
            'C',
            'CD/CF',
            'ARU',
            'TR',
            'LM',
            'LNR',
            'DF',
            'AM',
            'SAN',
        ],
        editable: true,
        cellClassName: (params) => {
            if (params.value == null) {
                return '';
            }

            return clsx('super-app', {
                negative: params.value === 'A',
                positive: params.value === 'ISJ',
            });
        },
    })),
    {
        field: 'Dias Laborados',
        headerName: 'Dias Laborados',
        width: 120,
        editable: true,
        // count the number of days that are A in the 30 days in that row
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'A') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'ipe',
        headerName: 'IPE',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'IPE') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'im',
        headerName: 'IM',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'IM') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'af',
        headerName: 'AF',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'AF') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'ar',
        headerName: 'AR',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'AR') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'icj',
        headerName: 'ICJ',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'ICJ') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'isj',
        headerName: 'ISJ',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'ISJ') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'c',
        headerName: 'C',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'IPE') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'cd/cf',
        headerName: 'CD/CF',
        width: 70,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'C') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'aru',
        headerName: 'ARU',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'ARU') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'tr',
        headerName: 'TR',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'TR') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'am',
        headerName: 'AM',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'AM') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'san',
        headerName: 'SAN',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'SAN') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'lnr',
        headerName: 'LNR',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'LNR') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'lm',
        headerName: 'LM',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'LM') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'r',
        headerName: 'R',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'R') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'v',
        headerName: 'V',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'V') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'df',
        headerName: 'DF',
        width: 50,
        editable: true,
        type: 'number',
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (row[`day${i}`] === 'DF') {
                    count++;
                }
            }
            return count;
        },
    },
    {
        field: 'total_days',
        headerName: 'DIAS TOTALES LABORADOS',
        width: 200,
        editable: true,
        type: 'number',
        // Count `dias laborados` + `ipe` + `im` + `af` + `ar` + `c` + `cd/cf` + `aru` +  `am` + `df
        valueGetter: (value, row) => {
            let count = 0;
            for (let i = 1; i <= 30; i++) {
                if (
                    row[`day${i}`] === 'A' ||
                    row[`day${i}`] === 'IPE' ||
                    row[`day${i}`] === 'IM' ||
                    row[`day${i}`] === 'AF' ||
                    row[`day${i}`] === 'AR' ||
                    row[`day${i}`] === 'C' ||
                    row[`day${i}`] === 'CD/CF' ||
                    row[`day${i}`] === 'ARU' ||
                    row[`day${i}`] === 'AM' ||
                    row[`day${i}`] === 'DF'
                ) {
                    count++;
                }
            }
            return count;
        },
    },
];

const initialRows = Array.from({ length: 800 }, (_, index) => {
    const row = {
        id: index + 1,
        employeeId: `${index + 1 + 1000000}`,
        name: `Empleado ${index + 1}`,
        campaign: `Campaña ${index + 1}`,
    };
    for (let i = 1; i <= 800; i++) {
        row[`day${i}`] = Math.random() > 0.9 ? 'ISJ' : 'A';
    }
    return row;
});

export default function Assistance() {
    const [rowModesModel, setRowModesModel] = useState({});
    const [rows, setRows] = useState(initialRows);

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.Edit },
        });
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View },
        });
    };

    const handleDeleteClick = (id) => () => {
        setRows(rows.filter((row) => row.id !== id));
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        const editedRow = rows.find((row) => row.id === id);
        if (editedRow.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const currentMonth = new Date().getMonth();
    const months = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
    ];
    const availableMonths = months.slice(0, currentMonth + 1);

    return (
        <Container
            sx={{
                mt: '6rem',
            }}
        >
            <Typography sx={{ p: '2rem', textAlign: 'center' }} variant="h3">
                {months[currentMonth]}
            </Typography>
            <TextField sx={{ width: '5rem', pb: '2rem' }} select label={'Mes'}>
                {availableMonths.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>
            <Box
                sx={{
                    height: '80vh',
                    '& .super-app-theme--cell': {
                        backgroundColor: 'rgba(224, 183, 60, 0.55)',
                        color: '#1a3e72',
                        fontWeight: '600',
                    },
                    '& .super-app.negative': {
                        backgroundColor: 'rgba(157, 255, 118, 0.49)',
                        color: '#1a3e72',
                        fontWeight: '600',
                    },
                    '& .super-app.positive': {
                        backgroundColor: '#d47483',
                        color: '#1a3e72',
                        fontWeight: '600',
                    },
                }}
            >
                <DataGrid
                    sx={{ fontSize: '.8rem' }}
                    rows={rows}
                    slots={{
                        toolbar: GridToolbar,
                        noResultsOverlay: CustomNoResultsOverlay,
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            csvOptions: {
                                fileName: 'assistance.csv',
                                delimiter: ';',
                                utf8WithBom: true,
                            },
                        },
                    }}
                    columns={columns}
                    pageSize={10}
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={handleRowModesModelChange}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                />
            </Box>
        </Container>
    );
}
