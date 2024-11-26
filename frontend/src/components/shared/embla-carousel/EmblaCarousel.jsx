// Libraries
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useState, useEffect } from 'react';
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

// Icons
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';

// Material-UI
import { IconButton, Box } from '@mui/material';

const getCarouselImages = async (setImages, showSnack) => {
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

const deleteCarouselImage = async (id, showSnack, setImages) => {
    try {
        const response = await fetch(
            `${getApiUrl().apiUrl}carousel-images/banners/${id}/`,
            {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        await handleError(response, showSnack);

        if (response.status === 204) {
            showSnack('success', 'Imagen eliminada correctamente');
            getCarouselImages(setImages, showSnack);
        }
    } catch (error) {
        if (getApiUrl().environment === 'development') {
            console.error(error);
        }
    }
};

const IconButtonsStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    '&:hover': {
        backgroundColor: 'white',
        color: 'gray',
    },
    transition: 'all 0.3s',
};

export function EmblaCarousel() {
    const { showSnack } = useSnackbar();
    const [images, setImages] = useState([]);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const permissions = JSON.parse(localStorage.getItem('permissions')) || [];

    useEffect(() => {
        getCarouselImages(setImages);
    }, []);

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
        Autoplay({ delay: 4000, stopOnInteraction: false }),
    ]);

    const { selectedIndex, scrollSnaps, onDotButtonClick } =
        useDotButton(emblaApi);

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
            <div
                className="embla"
                style={{ overflow: 'hidden' }}
                ref={emblaRef}
            >
                <div
                    className="embla__container"
                    style={{
                        display: 'flex',
                        height: '100%',
                        width: '1280px',
                    }}
                >
                    {images.length > 0 &&
                        images.map((image, index) => (
                            <Box
                                key={index}
                                style={{
                                    flex: '0 0 100%',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                    margin: '20px 20px 0 0',
                                    position: 'relative',
                                }}
                                className="embla__slide"
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: '.5rem',
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                    }}
                                >
                                    {permissions &&
                                    permissions.includes(
                                        'carousel_image.add_banner'
                                    ) ? (
                                        <IconButton
                                            onClick={() =>
                                                setOpenAddDialog(true)
                                            }
                                            sx={IconButtonsStyle}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    ) : null}
                                    {permissions &&
                                    permissions.includes(
                                        'carousel_image.delete_banner'
                                    ) ? (
                                        <IconButton
                                            onClick={() =>
                                                deleteCarouselImage(
                                                    image.id,
                                                    showSnack,
                                                    setImages
                                                )
                                            }
                                            sx={IconButtonsStyle}
                                        >
                                            <DeleteForeverIcon />
                                        </IconButton>
                                    ) : null}
                                </Box>
                                <img
                                    width={'100%'}
                                    height={'720px'}
                                    style={{ borderRadius: '1.8rem' }}
                                    src={image.image}
                                    alt={image.title}
                                />
                            </Box>
                        ))}
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
