import React from 'react';
import { Dialog, DialogContent, TextField, Button, Stack, DialogTitle } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface ModalInputsNeuProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }) => void;
    initialRemanente?: number; // Nuevo prop para autofill
    initialOdometro?: number;
    initialPresionAire?: number;
    initialTorqueAplicado?: number;
}

const ModalInputsNeu: React.FC<ModalInputsNeuProps> = ({ open, onClose, onSubmit, initialRemanente = 0, initialOdometro = 0, initialPresionAire = 0, initialTorqueAplicado = 0 }) => {
    const [Odometro, setOdometro] = React.useState<number>(initialOdometro);
    const [Remanente, setRemanente] = React.useState<number>(initialRemanente);
    const [PresionAire, setPresionAire] = React.useState<number>(initialPresionAire);
    const [TorqueAplicado, setTorqueAplicado] = React.useState<number>(initialTorqueAplicado);
    const [kmError, setKmError] = React.useState(false); // Estado para el error del kilometraje
    const [presionError, setPresionError] = React.useState(false);
    const [torqueError, setTorqueError] = React.useState(false);
    const [fechaAsignacion, setFechaAsignacion] = React.useState<string>('');

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    React.useEffect(() => {
        if (open) {
            setOdometro(initialOdometro);
            setRemanente(initialRemanente);
            setPresionAire(initialPresionAire);
            setTorqueAplicado(initialTorqueAplicado);
            setKmError(false);
            setPresionError(false);
            setTorqueError(false);
            setFechaAsignacion('');
        }
    }, [open, initialRemanente, initialOdometro, initialPresionAire, initialTorqueAplicado]);

    const handleSubmit = () => {
        if (Odometro < initialOdometro) {
            setKmError(true);
            return;
        }
        if (PresionAire < 25 || PresionAire > 50) {
            setPresionError(true);
            return;
        }
        if (TorqueAplicado < 110 || TorqueAplicado > 150) {
            setTorqueError(true);
            return;
        }
        onSubmit({ Odometro, Remanente, PresionAire, TorqueAplicado, FechaAsignacion: fechaAsignacion });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
            {/* <DialogTitle>Ingresar datos</DialogTitle> */}
            <DialogContent>
                <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Remanente"
                            type="number"
                            value={Remanente}
                            onChange={(e) => setRemanente(Number(e.target.value))}
                            fullWidth
                            InputProps={{
                                inputProps: { min: 0 },
                                sx: {
                                    'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0,
                                    },
                                    'input[type=number]': {
                                        MozAppearance: 'textfield',
                                    },
                                },
                            }}
                        />
                        <TextField
                            label="Presión de Aire"
                            type="number"
                            value={PresionAire === 0 ? '' : PresionAire}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setPresionAire(value);
                                if (value < 25 || value > 50) {
                                    setPresionError(true);
                                } else {
                                    setPresionError(false);
                                }
                            }}
                            fullWidth
                            error={presionError}
                            helperText={presionError ? 'Debe estar entre 25 y 50 psi' : 'Rango permitido: 25-50 psi'}
                            InputProps={{
                                inputProps: { min: 25, max: 50 },
                                sx: {
                                    'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0,
                                    },
                                    'input[type=number]': {
                                        MozAppearance: 'textfield',
                                    },
                                },
                            }}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label="Torque"
                            type="number"
                            value={TorqueAplicado === 0 ? '' : TorqueAplicado}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setTorqueAplicado(value);
                                if (value < 110 || value > 150) {
                                    setTorqueError(true);
                                } else {
                                    setTorqueError(false);
                                }
                            }}
                            fullWidth
                            error={torqueError}
                            helperText={torqueError ? 'Debe estar entre 110 y 150 Nm (Toyota Hilux)' : 'Recomendado: 110-150 Nm'}
                            InputProps={{
                                inputProps: { min: 110, max: 150 },
                                sx: {
                                    'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0,
                                    },
                                    'input[type=number]': {
                                        MozAppearance: 'textfield',
                                    },
                                },
                            }}
                        />
                        <TextField
                            label="Fecha de Asignación"
                            type="date"
                            value={fechaAsignacion}
                            onChange={e => setFechaAsignacion(e.target.value)}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                    <Button onClick={handleSubmit} variant="contained" color="primary" fullWidth>
                        Guardar
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default ModalInputsNeu;
