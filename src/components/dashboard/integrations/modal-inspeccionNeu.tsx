import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';

interface Neumatico {
  POSICION: string;
  // Otras propiedades del neumático si es necesario
}

interface ModalInpeccionNeuProps {
  open: boolean;
  onClose: () => void;
  placa: string;
  neumaticosAsignados: Neumatico[]; // Nuevo: array de neumáticos asignados
}

const ModalInpeccionNeu: React.FC<ModalInpeccionNeuProps> = ({ open, onClose, placa, neumaticosAsignados }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      {/* <DialogTitle sx={{ fontWeight: 'bold', color: '#388e3c' }}>Inspección de Neumáticos</DialogTitle> */}
      <DialogContent>
        <Stack direction="row" spacing={2}>
          {/* Columna izquierda: Formulario e historial */}
          <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px' }}>
            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
              <Box>
                {/* Placeholder de campos */}
              </Box>
            </Card>
            <Card sx={{ p: 2 }}>
              <Box>
                {/* Placeholder de historial */}
              </Box>
            </Card>
          </Stack>
          {/* Columna derecha: Imagen o visualización */}
          <Card sx={{
            flex: 0.5,
            p: 2,
            position: 'relative',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            maxWidth: 400, 
            minWidth: 320, 
            width: '100%'  
          }}>
            <Box sx={{ position: 'relative', width: '370px', height: '430px' }}>
              <DiagramaVehiculo neumaticosAsignados={neumaticosAsignados} layout="modal" />
              <img
                src="/assets/placa.png"
                alt="Placa"
                style={{
                  width: '120px',
                  height: '60px',
                  objectFit: 'contain',
                  position: 'absolute',
                  top: '10px',
                  right: '68px',
                  zIndex: 2,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: '24px',
                  right: '68px',
                  zIndex: 3,
                  color: 'black',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontSize: '24px',
                  textAlign: 'center',
                }}
              >
                {placa}
              </Box>
            </Box>
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained">
          Cerrar
        </Button>
        <Button color="success" variant="contained" sx={{ ml: 1 }}>
          Guardar inspección
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalInpeccionNeu;
