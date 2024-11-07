// src/utils/errorHandler.js

export const handleError = async (response, showSnack) => {
    let errorMessage =
        'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.';

    if (!response.ok) {
        switch (response.status) {
            case 400:
                const data = await response.json();
                let firstKey = Object.keys(data)[0];

                if (firstKey === 'Error') {
                    // Check if the "Error" value is a string and handle it directly
                    if (typeof data[firstKey] === 'string') {
                        errorMessage = data[firstKey]; // Directly set the error message
                    } else if (Array.isArray(data[firstKey])) {
                        // If it's an array, pick the first item
                        errorMessage = data[firstKey][0];
                    } else {
                        // If it's an object or anything unexpected, fall back to a generic message
                        errorMessage =
                            'Por favor, verifica la información ingresada y vuelve a intentarlo.';
                    }
                } else {
                    // Handle non-nested error cases (same logic as before)
                    if (typeof data[firstKey] === 'string') {
                        errorMessage = data[firstKey];
                    } else if (Array.isArray(data[firstKey])) {
                        errorMessage = data[firstKey][0];
                    } else {
                        errorMessage =
                            'Por favor, verifica la información ingresada y vuelve a intentarlo.';
                    }
                }
                break;
            case 401:
                errorMessage =
                    'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
                break;
            case 403:
                errorMessage = 'No tiene permiso para realizar esta acción.';
                break;
            case 404:
                errorMessage = 'No se encontraron registros para actualizar.';
                break;
            case 409:
                errorMessage = 'El archivo ya existe.';
                break;
            case 422:
                errorMessage = 'El archivo no cumple con el formato.';
                break;
            case 500:
                errorMessage =
                    'Lo sentimos, se ha producido un error inesperado.';
                break;
            default:
                const defaultData = await response.json();
                errorMessage =
                    defaultData.error || 'Ocurrió un error inesperado.';
        }
        showSnack('error', errorMessage);
        throw new Error(errorMessage);
    }
};
