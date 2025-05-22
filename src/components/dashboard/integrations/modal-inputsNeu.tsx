import React from 'react';
import { Dialog, DialogContent, TextField, Button, Stack, DialogTitle } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface ModalInputsNeuProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { kilometraje: number; remanente: number; presionAire: number }) => void;
}

const ModalInputsNeu: React.FC<ModalInputsNeuProps> = ({ open, onClose, onSubmit }) => {
    const [kilometraje, setKilometraje] = React.useState<number>(0);
    const [remanente, setRemanente] = React.useState<number>(0);
    const [presionAire, setPresionAire] = React.useState<number>(0);

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const handleSubmit = () => {
        onSubmit({ kilometraje, remanente, presionAire });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
            <DialogTitle>Ingresar datos</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <TextField
                        label="Kilometraje"
                        type="number"
                        value={kilometraje}
                        onChange={(e) => setKilometraje(Number(e.target.value))}
                        fullWidth
                    />
                    <TextField
                        label="Remanente"
                        type="number"
                        value={remanente}
                        onChange={(e) => setRemanente(Number(e.target.value))}
                        fullWidth
                    />
                    <TextField
                        label="Presión de Aire"
                        type="number"
                        value={presionAire}
                        onChange={(e) => setPresionAire(Number(e.target.value))}
                        fullWidth
                    />
                    <Button onClick={handleSubmit} variant="contained" color="primary" fullWidth>
                        Guardar
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default ModalInputsNeu;
