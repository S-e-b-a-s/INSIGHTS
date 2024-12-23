import { useEffect, useState, lazy, Suspense } from 'react';

// Custom Components
const CarouselComponent = lazy(() => import('@components/shared/Carousel'));
import { EmblaCarousel } from '../shared/embla-carousel/EmblaCarousel';
import { getApiUrl } from '@assets/getApi.js';
import { handleError } from '@assets/handleError';
const BirthdaySlider = lazy(() => import('@components/shared/BirthdaySlider'));

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext.jsx';

// Material-UI
import { Typography, Box, Container, Card } from '@mui/material';

// Media
const benefit = `${getApiUrl().apiUrl}static/images/benefits/benefit-1.webp`;
const cake = `${getApiUrl().apiUrl}static/images/birthdays/cake.webp`;
const AvatarImage = `${getApiUrl().apiUrl}static/images/birthdays/avatar.webp`;
const fultbolVideo = `${getApiUrl().apiUrl}static/videos/futbol.mp4`;
const pointsVideo = `${getApiUrl().apiUrl}static/videos/points.mp4`;

// Libraries
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Home = () => {
    const [todayBirthdays, setTodayBirthdays] = useState([]);
    const [yesterdayBirthdays, setYesterdayBirthdays] = useState([]);
    const [tomorrowBirthdays, setTomorrowBirthdays] = useState([]);
    const { showSnack } = useSnackbar();
    const queryClient = new QueryClient();

    const fetchImages = async (employees) => {
        const imagePromises = employees.map(async (employee) => {
            try {
                const imageResponse = await fetch(
                    `${getApiUrl(true).apiUrl}profile-picture/${employee.cedula}`,
                    {
                        method: 'GET',
                    }
                );

                const firstNames = employee.nombres;
                const lastNames = employee.apellidos || '';

                const firstNamesParts = firstNames.split(' ');
                const lastNamesParts = lastNames.split(' ');

                const wholeName = `${firstNames} ${lastNames}`.trim();

                let formattedName = '';
                if (wholeName.split(' ').length === 4) {
                    formattedName =
                        `${firstNamesParts[0]} ${lastNamesParts[0]}`.trim();
                } else {
                    formattedName = `${firstNames} ${lastNames}`.trim();
                }

                if (imageResponse.status === 200) {
                    return {
                        image: `${getApiUrl(true).apiUrl}profile-picture/${employee.cedula}`,
                        name: formattedName,
                        subtitle: employee.campana_general,
                    };
                }

                // If image not found, return null
                return {
                    image: AvatarImage,
                    name: formattedName,
                    subtitle: employee.campana_general,
                };
            } catch (error) {
                if (getApiUrl().environment === 'development') {
                    console.error(error);
                }
            }
        });

        return (await Promise.all(imagePromises)).filter(
            (image) => image !== null
        );
    };

    const getBirthdaysId = async () => {
        try {
            const response = await fetch(
                `${getApiUrl(true).apiUrl}profile-picture/birthday`,
                {
                    method: 'GET',
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                const yesterdayBirthdays = data.data.yesterday;
                const todayBirthdays = data.data.today;
                const tomorrowBirthdays = data.data.tomorrow;

                const yesterdayImages = await fetchImages(yesterdayBirthdays);
                const todayImages = await fetchImages(todayBirthdays);
                const tomorrowImages = await fetchImages(tomorrowBirthdays);

                setYesterdayBirthdays(yesterdayImages);
                setTodayBirthdays(todayImages);
                setTomorrowBirthdays(tomorrowImages);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        getBirthdaysId();
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <Box
                sx={{
                    p: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <QueryClientProvider client={queryClient}>
                    <EmblaCarousel />
                </QueryClientProvider>
            </Box>
            <Container
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                }}
            >
                <Typography
                    color="primary"
                    id="section1"
                    variant="h4"
                    sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'center',
                        pt: '1em',
                        fontFamily: 'Poppins',
                    }}
                >
                    ¡Tenemos una super noticia para compartir!
                </Typography>
                <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    Hemos lanzado un nuevo plan de reconocimiento "puntos de
                    excelencia C&C", diseñado para motivarlos y recompensar su
                    esfuerzo y dedicación.
                </Typography>
                <Typography
                    color="primary"
                    id="section1"
                    variant="h6"
                    sx={{ textAlign: 'center' }}
                >
                    Conoce mas en el siguiente video
                </Typography>
                <Box
                    display={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <video
                        style={{
                            borderRadius: '8px',
                            width: '100%',
                            height: '100%',
                        }}
                        controls
                    >
                        <source src={pointsVideo} type="video/mp4" />
                    </video>
                </Box>
            </Container>

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    justifyContent: 'center',
                    textAlign: 'center',
                    alignItems: 'center',
                    padding: '1em',
                    fontWeight: 500,
                    fontSize: '16px',
                }}
            >
                <Typography
                    variant="h4"
                    color="primary"
                    id="section1"
                    sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'center',
                        pt: '1em',
                        fontFamily: 'Poppins',
                    }}
                >
                    Cumpleaños
                </Typography>
                <Typography
                    variant="subtitle1"
                    sx={{
                        display: 'flex',
                        width: '50%',
                        justifyContent: 'center',
                        padding: '1em',
                    }}
                >
                    ¡Feliz cumpleaños a nuestros queridos colaboradores que nos
                    llenan de alegría y éxito! 🎉🎂{' '}
                </Typography>
            </Box>
            <Suspense>
                <Box
                    sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'center',
                        gap: '1rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <Card sx={{ maxWidth: 350, width: 350, height: 700 }}>
                        {yesterdayBirthdays.length === 0 ? (
                            <>
                                <img
                                    style={{ borderRadius: '15px' }}
                                    width={350}
                                    height={465}
                                    alt="imagen-pastel-cumpleaños"
                                    src={cake}
                                ></img>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        pt: '2rem',
                                    }}
                                >
                                    <Typography variant="h6" color="gray">
                                        Ayer no hubo cumpleaños
                                    </Typography>
                                    <Typography variant="body" color="gray">
                                        ¡Pero siempre hay espacio para una
                                        sonrisa!
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <Suspense>
                                <CarouselComponent
                                    contain={true}
                                    items={yesterdayBirthdays}
                                    day={'Ayer'}
                                    height={'465px'}
                                    width={'100%'}
                                />
                            </Suspense>
                        )}
                    </Card>
                    <Card sx={{ maxWidth: 350, width: 350, height: 700 }}>
                        {todayBirthdays.length === 0 ? (
                            <>
                                <img
                                    style={{ borderRadius: '15px' }}
                                    width={350}
                                    height={465}
                                    alt="imagen-pastel-cumpleaños"
                                    src={cake}
                                ></img>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        pt: '2rem',
                                    }}
                                >
                                    <Typography variant="h6" color="gray">
                                        Hoy no hay cumpleaños
                                    </Typography>
                                    <Typography variant="body" color="gray">
                                        ¡Pero siempre hay espacio para una
                                        sonrisa!
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <Suspense>
                                <CarouselComponent
                                    contain={true}
                                    items={todayBirthdays}
                                    day={'Hoy'}
                                    height={'465px'}
                                    width={'100%'}
                                />
                            </Suspense>
                        )}
                    </Card>{' '}
                    <Card sx={{ maxWidth: 350, width: 350, height: 700 }}>
                        {tomorrowBirthdays.length === 0 ? (
                            <>
                                <img
                                    style={{ borderRadius: '15px' }}
                                    width={350}
                                    height={465}
                                    alt="imagen-pastel-cumpleaños"
                                    src={cake}
                                ></img>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        pt: '2rem',
                                    }}
                                >
                                    <Typography variant="h6" color="gray">
                                        Mañana no hay cumpleaños
                                    </Typography>
                                    <Typography variant="body" color="gray">
                                        ¡Pero siempre hay espacio para una
                                        sonrisa!
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <Suspense>
                                <CarouselComponent
                                    contain={true}
                                    items={tomorrowBirthdays}
                                    day={'Mañana'}
                                    height={'465px'}
                                    width={'100%'}
                                />
                            </Suspense>
                        )}
                    </Card>{' '}
                </Box>
            </Suspense>
            <Container
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    pb: '2rem',
                    gap: '2rem',
                    mt: '2rem',
                }}
            >
                <Typography
                    color="primary"
                    id="section1"
                    variant="h4"
                    sx={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'center',
                        pt: '1em',
                        fontFamily: 'Poppins',
                    }}
                >
                    ¡C&C Apoyando el deporte!
                </Typography>
                <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    En C&C respaldamos con entusiasmo el deporte y en particular
                    el fútbol femenino. A través de nuestro patrocinio, hemos
                    contribuido al éxito de nuestro equipo Future Soccer, que
                    recientemente se destacó al ganar el torneo de la copa
                    Nottingham. Este logro no solo refuerza nuestro compromiso
                    con la comunidad, sino que también subraya nuestro apoyo a
                    la equidad de género en el deporte. Estamos emocionados de
                    seguir respaldando y empoderando a nuestras talentosas
                    atletas mientras continúan alcanzando nuevas metas.
                    <br /> ¡En C&C Services creemos en el poder transformador
                    del deporte para construir un futuro más sólido y unido!
                </Typography>
                <Box
                    display={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <video
                        style={{
                            borderRadius: '8px',
                            width: '100%',
                            height: '100%',
                        }}
                        controls
                    >
                        <source src={fultbolVideo} type="video/mp4" />
                    </video>
                </Box>
            </Container>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: '2rem',
                    gap: '2rem',
                    flexWrap: 'wrap',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2rem',
                    }}
                >
                    <Typography
                        variant="h4"
                        color="primary"
                        id="section1"
                        sx={{
                            display: 'flex',
                            width: '100%',
                            justifyContent: 'center',
                            pt: '1em',
                            fontFamily: 'Poppins',
                        }}
                    >
                        Beneficios
                    </Typography>
                    <img
                        loading="lazy"
                        style={{ borderRadius: '1rem' }}
                        width={540}
                        height={960}
                        src={benefit}
                        alt="beneficio"
                    />
                </Box>
            </Box>
        </>
    );
};

export default Home;
