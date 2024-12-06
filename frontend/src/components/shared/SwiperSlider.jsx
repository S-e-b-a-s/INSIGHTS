import React, { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Box, Typography } from '@mui/material';
import {
    DotButton,
    useDotButton,
} from '@components/shared/embla-carousel/EmblaCarouselDotButton';
import '@src/index.css';

// Media
const juniorHelpdeskManager = `${getApiUrl().apiUrl}static/images/managers-jr/junior-helpdesk-manager.webp`;
const juniorContactCenterApplicationsManager = `${getApiUrl().apiUrl}static/images/managers-jr/junior-contact-center-applications-manager.webp`;
const juniorInfrastructureNetworkManager = `${getApiUrl().apiUrl}static/images/managers-jr/junior-infrastructure-network-manager.webp`;
const juniorAccountManager1 = `${getApiUrl().apiUrl}static/images/managers-jr/junior-account-manager-1.webp`;
const juniorAccountManager2 = `${getApiUrl().apiUrl}static/images/managers-jr/junior-account-manager-2.webp`;
const juniorAccountManager3 = `${getApiUrl().apiUrl}static/images/managers-jr/junior-account-manager-3.webp`;

// Custom components and functions
import { getApiUrl } from '@assets/getApi';

const managersJr = [
    {
        name: 'Marcela Osorio',
        management: 'GERENTE JR. DE MESA DE SERVICIO',
        image: juniorHelpdeskManager,
        description: '',
    },
    {
        name: 'Christian Moncaleano',
        management: 'GERENTE JR. DE APLICACIONES DE CONTACT CENTER',
        image: juniorContactCenterApplicationsManager,
        description: '',
    },
    {
        name: 'Luis Peña',
        management: 'GERENTE JR. INFRAESTRUCTURA Y REDES',
        image: juniorInfrastructureNetworkManager,
        description: '',
    },
    {
        name: 'Julio Cesar',
        management: 'GERENTE DE CUENTAS',
        image: juniorAccountManager1,
        description: '',
    },
    {
        name: 'Luis Rodriguez',
        management: 'GERENTE DE CUENTAS JR',
        image: juniorAccountManager2,
        description: '',
    },
    {
        name: 'Katterene Castrillon',
        management: 'GERENTE DE CUENTAS',
        image: juniorAccountManager3,
        description: '',
    },
];

const SwiperSlider = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 4000, stopOnInteraction: false }),
    ]);

    const { selectedIndex, scrollSnaps, onDotButtonClick } =
        useDotButton(emblaApi);

    return (
        <div className="embla" style={{ margin: 'auto', maxWidth: '80rem' }}>
            <div
                className="embla__viewport"
                ref={emblaRef}
                style={{ overflow: 'hidden' }}
            >
                <div
                    className="embla__container"
                    style={{
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        touchAction: 'pan-y pinch-zoom',
                    }}
                >
                    {managersJr.map((manager, index) => (
                        <div
                            className="embla__slide"
                            key={index}
                            style={{
                                flex: '0 0 35%',
                                minWidth: 0,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '10px',
                                }}
                            >
                                <img
                                    src={manager.image}
                                    alt={manager.name}
                                    style={{
                                        width: '100%',
                                        maxWidth: '350px',
                                        borderRadius: '5%',
                                        objectFit: 'cover',
                                    }}
                                />
                                <Box sx={{ mt: '1rem', textAlign: 'center' }}>
                                    <Typography variant="h4">
                                        {manager.name}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        {manager.management}
                                    </Typography>
                                </Box>
                            </Box>
                        </div>
                    ))}
                </div>
            </div>
            <div className="embla__dots">
                {scrollSnaps.map((_, index) => (
                    <DotButton
                        key={index}
                        onClick={() => onDotButtonClick(index)}
                        className={'embla__dot'.concat(
                            index === selectedIndex
                                ? ' embla__dot--selected'
                                : ''
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

export default SwiperSlider;
