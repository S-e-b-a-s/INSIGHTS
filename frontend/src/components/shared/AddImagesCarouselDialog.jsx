import { useState } from 'react';

// Libraries
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

// Material-UI
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    MenuItem,
    Box,
    DialogContentText,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Collapse,
} from '@mui/material';

// MUI Lab
import { LoadingButton } from '@mui/lab';

// Custom Hooks
import { useSnackbar } from '../context/SnackbarContext';
import { useProgressbar } from '../context/ProgressbarContext';

// Custom components and assets
import { getApiUrl } from '../../assets/getApi';
import { handleError } from '../../assets/handleError';

registerPlugin(
    FilePondPluginImageExifOrientation,
    FilePondPluginImagePreview,
    FilePondPluginFileValidateType
);

const AddImagesCarouselDialog = ({
    openAddDialog,
    setOpenAddDialog,
    currentImages,
    getCarouselImages,
    setImages,
}) => {
    const [image, setImage] = useState([]);
    const { showSnack } = useSnackbar();
    const [openCollapse, setOpenCollapse] = useState(false);
    const { isProgressVisible, showProgressbar, hideProgressbar } =
        useProgressbar();

    const handleSubmit = async (event) => {
        event.preventDefault();
        showProgressbar();
        const position = event.target.position?.value || '';
        const link = openCollapse ? event.target.link.value : '';
        if (!validateFormData(image)) return;

        const formData = createFormData(image, position, link);
        await sendApiRequest(formData);
    };

    const validateFormData = (image) => {
        if (image.length === 0) {
            showSnack('error', 'Debes añadir una imagen');
            hideProgressbar();
            return false;
        }
        return true;
    };

    const createFormData = (image, position, link) => {
        const formData = new FormData();
        formData.append('image', image[0]);
        formData.append('title', image[0]?.name);
        formData.append('order', position);

        if (link) {
            formData.append('link', link);
        }
        return formData;
    };

    const sendApiRequest = async (formData) => {
        try {
            const response = await fetch('http://localhost/', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            await handleError(response, showSnack);

            if (response.status === 201) {
                getCarouselImages(setImages, showSnack);
                showSnack('success', 'Imagen añadida correctamente');
            }
        } catch (error) {
            if (getApiUrl().environment === 'development') {
                console.error(error);
            }
        } finally {
            setOpenAddDialog(false);
            hideProgressbar();
        }
    };

    return (
        <Box>
            <Dialog
                maxWidth={'md'}
                fullWidth={true}
                component="form"
                data-testid="add-images-carousel-form"
                onSubmit={handleSubmit}
                open={openAddDialog}
                onClose={() => setOpenAddDialog(false)}
            >
                <DialogContent>
                    <Typography variant="h4">Actualizar imagenes</Typography>
                    <DialogContentText
                        sx={{ mb: '1rem' }}
                        id="alert-dialog-slide-description"
                    >
                        Añade la imagen que deseas mostrar en el carousel de la
                        página principal.
                    </DialogContentText>
                    <Box>
                        <FormGroup sx={{ mb: '1rem' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        onChange={() =>
                                            setOpenCollapse(!openCollapse)
                                        }
                                    />
                                }
                                label="¿La imagen debería redireccionar a un link?"
                            />
                        </FormGroup>{' '}
                        <Collapse in={openCollapse}>
                            <TextField
                                sx={{
                                    width: '550px',
                                    mb: '2rem',
                                }}
                                name="link"
                                id="link"
                                label="Link"
                                variant="outlined"
                                required={openCollapse}
                                placeholder="intranet.cyc-bpo.com/logged/vacancies/ o forms.office.com/etc"
                            />
                        </Collapse>
                        <TextField
                            id="position"
                            name="position"
                            select
                            label="Posición"
                            variant="outlined"
                            defaultValue={1}
                            sx={{ width: '550px', mb: '1rem' }}
                        >
                            {currentImages.map((image, index) => (
                                <MenuItem key={index} value={index + 1}>
                                    {index + 1}
                                </MenuItem>
                            ))}
                            <MenuItem value={currentImages.length + 1}>
                                Ultima posición
                            </MenuItem>
                        </TextField>
                        <FilePond
                            name="filepond"
                            required
                            allowMultiple={true}
                            maxFiles={1}
                            imagePreviewHeight={470}
                            allowFileTypeValidation={true}
                            acceptedFileTypes={['image/*']}
                            onupdatefiles={(fileItems) => {
                                setImage(
                                    fileItems.map((fileItem) => fileItem.file)
                                );
                            }}
                            labelIdle="Arrastra y suelta tu imagen o busca en tu equipo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        disabled={isProgressVisible}
                        variant="contained"
                        onClick={() => setOpenAddDialog(false)}
                    >
                        Cancelar
                    </Button>
                    <LoadingButton
                        loading={isProgressVisible}
                        variant="contained"
                        type="submit"
                    >
                        Actualizar
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddImagesCarouselDialog;
