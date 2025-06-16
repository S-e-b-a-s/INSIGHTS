import React, { useState, useCallback } from 'react';

// Material-UI
import { Box } from '@mui/material';

// Icons
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';

// Custom Hooks
import { useSnackbar } from '@contexts/SnackbarContext';

// Custom Functions and Components
import { getApiUrl } from '@assets/getApi';
import { handleError } from '@assets/handleError';

const PLACEHOLDER_SRC = `data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D`;

const IconButtonsStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    '&:hover': {
        backgroundColor: 'white',
        color: 'gray',
    },
    transition: 'all 0.3s',
};

export const LazyLoadImage = (props) => {
    const { image, inView, setOpenAddDialog, setImages, getCarouselImages } =
        props;
    const [hasLoaded, setHasLoaded] = useState(false);
    const permissions = JSON.parse(localStorage.getItem('permissions')) || [];
    const { showSnack } = useSnackbar();

    const setLoaded = useCallback(() => {
        if (inView) setHasLoaded(true);
    }, [inView, setHasLoaded]);

    const deleteCarouselImage = async (id) => {
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

    return (
        <div className="embla__slide">
            <div
                className={'embla__lazy-load'.concat(
                    hasLoaded ? ' embla__lazy-load--has-loaded' : ''
                )}
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
                    permissions.includes('carousel_image.add_banner') ? (
                        <IconButton
                            onClick={() => setOpenAddDialog(true)}
                            sx={IconButtonsStyle}
                        >
                            <AddIcon />
                        </IconButton>
                    ) : null}
                    {permissions &&
                    permissions.includes('carousel_image.delete_banner') ? (
                        <IconButton
                            onClick={() => deleteCarouselImage(image.id)}
                            sx={IconButtonsStyle}
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                    ) : null}
                </Box>
                {!hasLoaded && <span className="embla__lazy-load__spinner" />}
                <img
                    className="embla__slide__img embla__lazy-load__img"
                    style={{
                        borderRadius: '1.8rem',
                        cursor: image.link ? 'pointer' : 'default',
                    }}
                    src={inView ? image.image : PLACEHOLDER_SRC}
                    onLoad={setLoaded}
                    data-src={image.image}
                    alt={image.title}
                    onClick={image.link ? () => window.open(image.link) : null}
                />
            </div>
        </div>
    );
};
