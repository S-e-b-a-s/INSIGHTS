import {
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
    useState,
} from 'react';

//Libraries
import 'cally';

//Material UI
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Collapse,
    IconButton,
    TextField,
    MenuItem,
} from '@mui/material';

// MUI Lab
import { LoadingButton } from '@mui/lab';

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext';
import { useProgressbar } from '@contexts/ProgressbarContext';

// Custom Components
import { getApiUrl } from '@assets/getApi';
import { handleError } from '@assets/handleError';

const useListener = (ref, event, listener) => {
    useEffect(() => {
        const current = ref.current;

        if (current && listener) {
            current.addEventListener(event, listener);
            return () => current.removeEventListener(event, listener);
        }
    }, [ref, event, listener]);
};

const useProperty = (ref, prop, value) => {
    useEffect(() => {
        if (ref.current) {
            ref.current[prop] = value;
        }
    }, [ref, prop, value]);
};

export const CalendarMonth = forwardRef(
    function CalendarMonth(props, forwardedRef) {
        return <calendar-month offset={props.offset} ref={forwardedRef} />;
    }
);

export const CalendarRange = forwardRef(function CalendarRange(
    { onChange, showOutsideDays, isDateDisallowed, ...props },
    forwardedRef
) {
    const ref = useRef();
    useImperativeHandle(forwardedRef, () => ref.current, []);
    useListener(ref, 'change', onChange);
    useProperty(ref, 'isDateDisallowed', isDateDisallowed);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    let minDate;
    if (currentDay > 20) {
        minDate = new Date(currentYear, currentMonth + 2, 1);
    } else {
        minDate = new Date(currentYear, currentMonth + 1, 1);
    }

    // Assuming your calendar-range component accepts a min attribute for the minimum date
    return (
        <calendar-range
            ref={ref}
            locale="es"
            show-outside-days={showOutsideDays || undefined}
            first-day-of-week={0}
            min={minDate.toISOString().split('T')[0]} // Format the date to YYYY-MM-DD
            max={new Date(currentYear + 1, 11, 31).toISOString().split('T')[0]} // December 31st of the next year
            {...props}
        />
    );
});

const Picker = ({ value, onChange, isMondayToFriday, holidays }) => { 
    const isDateDisallowed = (date) => {
        if (
            holidays
                .map((holiday) => holiday[0])
                .includes(date.toISOString().split('T')[0]) ||
            date.getDay() === 6 ||
            (isMondayToFriday ? date.getDay() === 5 : null)
        ) {
            return true;
        }
    };

    return (
        <CalendarRange
            value={value}
            isDateDisallowed={isDateDisallowed}
            onChange={onChange}
        >
            <IconButton aria-label="Previous" slot="previous">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M15.75 19.5 8.25 12l7.5-7.5"></path>
                </svg>
            </IconButton>
            <IconButton aria-label="Next" slot="next">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
                </svg>
            </IconButton>
            <Box
                sx={{
                    display: 'flex',
                    gap: '2em',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <CalendarMonth />
                <CalendarMonth offset={1} />
            </Box>
        </CalendarRange>
    );
};

const VacationsRequest = ({ openVacation, setOpenVacation, getVacations }) => {
    const { showSnack } = useSnackbar();
    const [value, setValue] = useState('');
    const [textDate, setTextDate] = useState('');
    const [daysAmount, setDaysAmount] = useState('');
    const [collapseDate, setCollapseDate] = useState(true);

    const { isProgressVisible, showProgressbar, hideProgressbar } =
        useProgressbar();

    const [isMondayToFriday, setIsMondayToFriday] = useState(false);
    const [openCalendar, setOpenCalendar] = useState(false);
    const [holidays, setHolidays] = useState([]);

    const getTextMonth = (month) => {
        return new Date(
            new Date().setMonth(new Date().getMonth() + month)
        ).toLocaleString('es-ES', { month: 'long' });
    };

    const handleSchedule = (event) => {
        setIsMondayToFriday(event.target.value);
        setOpenCalendar(true);
        if (value !== '') {
            checkAmountOfDays({ target: { value: value } }, event.target.value);
        }
    };

    const getHolidays = async () => {
        const date = new Date();
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}services/holidays/${date.getFullYear()}/`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                setHolidays(data);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        getHolidays();
    }, []);

    const checkAmountOfDays = (
        event,
        isMondayToFridayProp = isMondayToFriday
    ) => {
        const [startDate, endDate] = event.target.value.split('/');

        const start = new Date(startDate);
        const end = new Date(endDate);

        let diffDays = 0;
        for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            // exclude from the count the Sundays and the holidays and the Saturdays if the employee works from Monday to Friday
            if (
                dayOfWeek !== 6 &&
                !holidays
                    .map((holiday) => holiday[0])
                    .includes(date.toISOString().split('T')[0]) &&
                (dayOfWeek !== 5 || !isMondayToFridayProp)
            ) {
                diffDays++;
            }
        }

        setDaysAmount(diffDays);
        setTextDate(`${startDate} al ${endDate}`);
        setValue(event.target.value);
        if (diffDays > 15) {
            showSnack(
                'error',
                'El periodo de vacaciones seleccionado excede los 15 días hábiles permitidos.'
            );
        }
    };

    const onChange = (event) => {
        if (textDate === '') {
            checkAmountOfDays(event);
            return;
        }

        setCollapseDate(false);
        setTimeout(() => {
            checkAmountOfDays(event);
        }, 200);

        setTimeout(() => {
            setCollapseDate(true);
        }, 200);
    };

    const handleCloseVacationDialog = () => {
        setOpenVacation(false);
        setOpenCalendar(false);
        setTextDate('');
        setValue('');
    };

    const handleSubmitVacationRequest = async (event) => {
        event.preventDefault();
        showProgressbar();
        const formData = new FormData();
        formData.append('sat_is_working', !isMondayToFriday);
        formData.append('start_date', value.split('/')[0]);
        formData.append('end_date', value.split('/')[1]);

        try {
            const response = await fetch(`${getApiUrl().apiUrl}vacation/`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            await handleError(response, showSnack);

            if (response.status === 201) {
                handleCloseVacationDialog();
                getVacations();
                showSnack(
                    'success',
                    'Solicitud de vacaciones enviada correctamente.'
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

    return (
        <Dialog
            maxWidth={'md'}
            open={openVacation}
            onClose={handleCloseVacationDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            component="form"
            onSubmit={handleSubmitVacationRequest}
        >
            <DialogTitle id="alert-dialog-title">
                {'¿Solicitud de Vacaciones?'}
            </DialogTitle>
            <DialogContent sx={{ paddingBottom: 0 }}>
                <Box
                    sx={{
                        p: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2rem',
                    }}
                >
                    <Typography
                        id="alert-dialog-description"
                        component="div"
                        sx={{ width: 700 }}
                    >
                        Antes de crear una solicitud de vacaciones, ten en
                        cuenta los siguientes datos:
                        <ul>
                            <li>
                                Ten en cuenta que no puedes solicitar vacaciones
                                para el mes actual.
                            </li>
                            <br />
                            <li>
                                Puedes solicitar vacaciones para{' '}
                                <b>{getTextMonth(1)}</b> si haces tu solicitud
                                antes del día 20 del <b>mes actual.</b>
                                <i>
                                    {' '}
                                    Si no lo haces en ese periodo, el proximo
                                    mes disponible para la solicitud sera{' '}
                                    <b>{getTextMonth(2)}</b>.
                                </i>
                            </li>
                            <br />
                            <li>
                                Asegúrate de seleccionar la cantidad de días
                                correctos. Recuerda que son máximo{' '}
                                <b>15 días hábiles vigentes</b> por solicitud,
                                así que ten en cuenta si tu horario es de{' '}
                                <b>lunes a viernes o de lunes a sábado</b>, y
                                también considera los <b>días festivos</b>.
                            </li>
                            <br />
                            <li>
                                Sube el archivo de solicitud de vacaciones en
                                formato PDF.
                            </li>
                            <br />
                            <li>
                                Las restricciones mencionadas ya están
                                implementadas en el calendario al seleccionar el
                                rango de fechas para las vacaciones.
                            </li>
                        </ul>
                    </Typography>

                    <Box sx={{ px: '4rem' }}>
                        <TextField
                            required
                            onChange={handleSchedule}
                            defaultValue={''}
                            sx={{ width: '100%' }}
                            select
                            label="Selecciona tu horario"
                        >
                            <MenuItem value={1}>Lunes a Viernes</MenuItem>
                            <MenuItem value={0}>Lunes a Sábado</MenuItem>
                        </TextField>
                    </Box>
                    <Collapse sx={{ margin: 'auto' }} in={!!textDate}>
                        <Typography sx={{ pt: '1rem' }}>
                            Periodo de vacaciones seleccionado:{' '}
                        </Typography>
                        <Collapse
                            sx={{ textAlign: 'center' }}
                            in={collapseDate}
                        >
                            <Typography style={{ fontWeight: 500 }}>
                                {textDate}
                            </Typography>
                            <Typography>
                                Cantidad de días hábiles seleccionados:{' '}
                                <b> {daysAmount} </b>
                            </Typography>
                        </Collapse>
                    </Collapse>
                    <Collapse sx={{ margin: 'auto' }} in={openCalendar}>
                        <Picker
                            value={value}
                            onChange={onChange}
                            showSnack={showSnack}
                            isMondayToFriday={isMondayToFriday}
                            holidays={holidays}
                        />
                    </Collapse>
                </Box>
            </DialogContent>
            <DialogActions
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: '2rem',
                }}
            >
                <Button variant="contained" onClick={handleCloseVacationDialog}>
                    Cancelar
                </Button>
                <LoadingButton
                    loading={isProgressVisible}
                    type="submit"
                    variant="contained"
                >
                    Solicitar
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default VacationsRequest;
