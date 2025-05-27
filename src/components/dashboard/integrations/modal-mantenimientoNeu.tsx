import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

interface ModalMantenimientoNeuProps {
    open: boolean;
    onClose: () => void;
}

const ModalMantenimientoNeu: React.FC<ModalMantenimientoNeuProps> = ({ open, onClose }) => {
    const [tipoMantenimiento, setTipoMantenimiento] = React.useState('');
    const [fecha, setFecha] = React.useState('');
    const [km, setKm] = React.useState('');
    const [observaciones, setObservaciones] = React.useState('');

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', color: '#ff9800' }}>Mantenimiento de Neumático</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '180px 1fr',
                        gap: 2,
                        mb: 2,
                    }}
                >
                    {/* Formulario de mantenimiento */}
                    <Box sx={{ gridColumn: '1/2', gridRow: '1/2', bgcolor: '#f9f6f2', borderRadius: 2, p: 2, boxShadow: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Registrar mantenimiento</Typography>
                        <TextField
                            label="Fecha"
                            type="date"
                            size="small"
                            fullWidth
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            sx={{ mb: 2 }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Tipo de mantenimiento"
                            select
                            size="small"
                            fullWidth
                            value={tipoMantenimiento}
                            onChange={e => setTipoMantenimiento(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="Rotación">Rotación</MenuItem>
                            <MenuItem value="Reparación">Reparación</MenuItem>
                            <MenuItem value="Reemplazo">Reemplazo</MenuItem>
                            <MenuItem value="Inspección">Inspección</MenuItem>
                        </TextField>
                        <TextField
                            label="Kilometraje"
                            type="number"
                            size="small"
                            fullWidth
                            value={km}
                            onChange={e => setKm(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Observaciones"
                            size="small"
                            fullWidth
                            multiline
                            minRows={2}
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                        />
                    </Box>
                    {/* Detalles del neumático o acciones rápidas */}
                    <Box sx={{ gridColumn: '2/3', gridRow: '1/2', bgcolor: '#f9f6f2', borderRadius: 2, p: 2, boxShadow: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Detalle del neumático</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Aquí puedes mostrar información relevante del neumático seleccionado, como número de serie, estado, etc.
                        </Typography>
                        {/* Puedes agregar más detalles o acciones aquí */}
                    </Box>
                    {/* Historial de mantenimientos */}
                    <Box sx={{ gridColumn: '1/3', gridRow: '2/3', bgcolor: '#f9f6f2', borderRadius: 2, p: 2, boxShadow: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Historial de mantenimientos</Typography>
                        <Typography variant="body2" color="text.secondary">
                            (Aquí se listarán los mantenimientos previos del neumático)
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">
                    Cerrar
                </Button>
                <Button color="warning" variant="contained" sx={{ ml: 1 }}>
                    Guardar mantenimiento
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalMantenimientoNeu;
