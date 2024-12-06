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
import managersJr2 from '@images/managers-jr/53069726.webp';
import managersJr4 from '@images/managers-jr/1010198435.jpg';
import managersJr5 from '@images/managers-jr/1016033764.webp';
import managersJr6 from '@images/managers-jr/91498957.webp';
import managersJr8 from '@images/managers-jr/28553156.webp';
import managersJr9 from '@images/managers-jr/1010178143.webp';

const managersJr = [
    {
        name: 'Marcela Osorio',
        management: 'GERENTE JR. DE MESA DE SERVICIO',
        image: managersJr8,
        description: '',
    },
    {
        name: 'Christian Moncaleano',
        management: 'GERENTE JR. DE APLICACIONES DE CONTACT CENTER',
        image: managersJr9,
        description: '',
    },
    {
        name: 'Katterene Castrillon',
        management: 'GERENTE DE CUENTAS',
        image: managersJr2,
        description: '',
    },
    {
        name: 'Luis Peña',
        management: 'GERENTE JR. INFRAESTRUCTURA Y REDES',
        image: managersJr4,
        description: '',
    },
    {
        name: 'Luis Rodriguez',
        management: 'GERENTE DE CUENTAS JR',
        image: managersJr5,
        description: '',
    },
    {
        name: 'Julio Cesar',
        management: 'GERENTE DE CUENTAS',
        image: managersJr6,
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
