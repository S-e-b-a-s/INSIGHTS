// Libraries
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useState, useEffect, useCallback } from 'react';
import {
    DotButton,
    useDotButton,
} from '@components/shared/embla-carousel/EmblaCarouselDotButton';

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext';

// Custom Functions and Components
import { getApiUrl } from '@assets/getApi';
import { handleError } from '@assets/handleError';
import AddImagesCarouselDialog from '@components/shared/embla-carousel/AddImagesCarouselDialog';
import { LazyLoadImage } from '@components/shared/embla-carousel/EmblaCarouselLazyLoadImage';

export function EmblaCarousel() {
    const { showSnack } = useSnackbar();
    const [images, setImages] = useState([]);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [slidesInView, setSlidesInView] = useState([]);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 4000, stopOnInteraction: false }),
    ]);

    const getCarouselImages = async () => {
        try {
            const response = await fetch(
                `${getApiUrl().apiUrl}carousel-images/banners/`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            await handleError(response, showSnack);

            if (response.status === 200) {
                const data = await response.json();
                setImages(data);
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        }
    };

    useEffect(() => {
        getCarouselImages();
    }, []);

    const { selectedIndex, scrollSnaps, onDotButtonClick } =
        useDotButton(emblaApi);

    const updateSlidesInView = useCallback(() => {
        if (!emblaApi) return;

        const inView = emblaApi.slidesInView();
        setSlidesInView((prev) => [...new Set([...prev, ...inView])]);
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        updateSlidesInView(emblaApi);
        emblaApi.on('slidesInView', updateSlidesInView);
        emblaApi.on('reInit', updateSlidesInView);
    }, [emblaApi, updateSlidesInView, images]);

    return (
        <>
            <AddImagesCarouselDialog
                openAddDialog={openAddDialog}
                setOpenAddDialog={setOpenAddDialog}
                currentImages={images}
                getCarouselImages={getCarouselImages}
                showSnack={showSnack}
                setImages={setImages}
            />
            <div className="embla" style={{ maxWidth: '100%' }}>
                <div
                    className="embla__viewport"
                    style={{ overflow: 'hidden' }}
                    ref={emblaRef}
                >
                    <div
                        className="embla__container"
                        style={{
                            display: 'flex',
                            touchAction: 'pan-y pinch-zoom',
                            height: '750px',
                            width: '1280px',
                        }}
                    >
                        {images.map((image, index) => (
                            <LazyLoadImage
                                key={index}
                                image={image}
                                getCarouselImages={getCarouselImages}
                                setImages={setImages}
                                setOpenAddDialog={setOpenAddDialog}
                                inView={slidesInView.indexOf(index) > -1}
                            />
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
        </>
    );
}
