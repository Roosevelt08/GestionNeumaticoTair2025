import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface ModalTodasPlacasProps {
    open: boolean;
    onClose: () => void;
}

const ModalTodasPlacas: React.FC<ModalTodasPlacasProps> = ({ open, onClose }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Todas las Placas</DialogTitle>
            <DialogContent>
                {/* Aquí puedes agregar el contenido del modal */}
                <p>Contenido del modal para todas las placas.</p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalTodasPlacas;
