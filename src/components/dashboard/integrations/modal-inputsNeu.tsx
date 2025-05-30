import React from 'react';
import { Dialog, DialogContent, TextField, Button, Stack, DialogTitle } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface ModalInputsNeuProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number }) => void;
}

const ModalInputsNeu: React.FC<ModalInputsNeuProps> = ({ open, onClose, onSubmit }) => {
    const [Odometro, setOdometro] = React.useState<number>(0);
    const [Remanente, setRemanente] = React.useState<number>(0);
    const [PresionAire, setPresionAire] = React.useState<number>(0);
    const [TorqueAplicado, setTorqueAplicado] = React.useState<number>(0);

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const handleSubmit = () => {
        onSubmit({ Odometro, Remanente, PresionAire, TorqueAplicado });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
            <DialogTitle>Ingresar datos</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <TextField
                        label="Kilometro"
                        type="number"
                        value={Odometro}
                        onChange={(e) => setOdometro(Number(e.target.value))}
                        fullWidth
                    />
                    <TextField
                        label="Remanente"
                        type="number"
                        value={Remanente}
                        onChange={(e) => setRemanente(Number(e.target.value))}
                        fullWidth
                    />
                    <TextField
                        label="Presión de Aire"
                        type="number"
                        value={PresionAire}
                        onChange={(e) => setPresionAire(Number(e.target.value))}
                        fullWidth
                    />
                    <TextField
                        label="Torque"
                        type="number"
                        value={TorqueAplicado}
                        onChange={(e) => setTorqueAplicado(Number(e.target.value))}
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
