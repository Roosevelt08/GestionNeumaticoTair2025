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
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';
import { useState } from 'react';
import ModalMantenimientoNeu from './modal-mantenimientoNeu';
import { listarNeumaticosAsignados } from '../../../api/Neumaticos';

interface Neumatico {
  POSICION: string;
}

interface Vehiculo {
  placa: string;
  marca: string;
  modelo: string;
  anio: string;
  color?: string;
  proyecto?: string;
  operacion?: string;
  kilometro?: number;
  presion_aire?: number;
  torque?: number;
}

interface ModalInpeccionNeuProps {
  open: boolean;
  onClose: () => void;
  placa: string;
  neumaticosAsignados: Neumatico[];
  vehiculo?: Vehiculo;
  onSeleccionarNeumatico?: (neumatico: any) => void; // NUEVO
}

const ModalInpeccionNeu: React.FC<ModalInpeccionNeuProps> = ({ open, onClose, placa, neumaticosAsignados, vehiculo, onSeleccionarNeumatico }) => {
  const [neumaticoSeleccionado, setNeumaticoSeleccionado] = useState<any | null>(null);
  const [formValues, setFormValues] = useState({
    kilometro: '',
    marca: '',
    modelo: '',
    codigo: '',
    posicion: '',
    medida: '',
    diseño: '',
    remanente: '',
    tipo_movimiento: '',
    estado: '',
    observacion: '',
    presion_aire: '',
    torque: '',
    fecha_inspeccion: '', // <-- Agregado para evitar el error
  });
  const [openMantenimiento, setOpenMantenimiento] = useState(false);
  const [neuAsignados, setNeuAsignados] = useState<any[]>([]);

  // Cargar datos de neu_asignado al abrir el modal
  React.useEffect(() => {
    if (open && placa) {
      listarNeumaticosAsignados(placa)
        .then(setNeuAsignados)
        .catch(() => setNeuAsignados([]));
    }
  }, [open, placa]);

  // Cuando se selecciona un neumático, llenar el formulario con datos completos de neu_asignado
  const handleSeleccionarNeumatico = (neumatico: any) => {
    setNeumaticoSeleccionado(neumatico);
    // Buscar datos completos en neuAsignados
    const neuFull = neuAsignados.find(n => n.POSICION === neumatico.POSICION || n.POSICION_NEU === neumatico.POSICION);
    console.log('neuFull seleccionado:', neuFull); // <-- Depuración para ver los datos reales
    setFormValues({
      kilometro: (neuFull?.ODOMETRO?.toString() ?? neuFull?.KILOMETRO?.toString() ?? vehiculo?.kilometro?.toString() ?? ''),
      marca: neuFull?.MARCA ?? neumatico.MARCA ?? '',
      modelo: neuFull?.MODELO ?? neumatico.MODELO ?? '',
      codigo: neuFull?.CODIGO_NEU ?? neuFull?.CODIGO ?? neumatico.CODIGO_NEU ?? neumatico.CODIGO ?? '',
      posicion: neuFull?.POSICION ?? neumatico.POSICION ?? '',
      medida: neuFull?.MEDIDA ?? neumatico.MEDIDA ?? '',
      diseño: neuFull?.DISEÑO ?? neumatico.DISEÑO ?? '',
      remanente: neuFull?.REMANENTE?.toString() ?? neumatico.REMANENTE?.toString() ?? '',
      tipo_movimiento: neuFull?.TIPO_MOVIMIENTO ?? '',
      estado: neuFull?.ESTADO ?? neumatico.ESTADO ?? '',
      observacion: neuFull?.OBSERVACION ?? neumatico.OBSERVACION ?? '',
      presion_aire: neuFull?.PRESION_AIRE?.toString() ?? neumatico.PRESION_AIRE?.toString() ?? '',
      torque: neuFull?.TORQUE_APLICADO?.toString() ?? neumatico.TORQUE_APLICADO?.toString() ?? '',
      fecha_inspeccion: neuFull?.FECHA_INSPECCION ?? '',
    });
    if (onSeleccionarNeumatico) onSeleccionarNeumatico(neumatico);
  };

  // Manejar apertura de mantenimiento y cierre de inspección
  const handleAbrirMantenimiento = () => {
    onClose();
    setTimeout(() => setOpenMantenimiento(true), 300); 
  };

  // Manejar cambios en los inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // Inicializar el kilometro al abrir el modal si hay vehículo
  React.useEffect(() => {
    if (open && vehiculo?.kilometro !== undefined) {
      setFormValues((prev) => ({ ...prev, kilometro: vehiculo.kilometro?.toString() ?? '' }));
    }
  }, [open, vehiculo?.kilometro]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        {/* <DialogTitle sx={{ fontWeight: 'bold', color: '#388e3c' }}>Inspección de Neumáticos</DialogTitle> */}
        <DialogContent>
          <Stack direction="row" spacing={2}>
            <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px' }}>
              <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Datos del vehículo</Typography>
                  {vehiculo ? (
                    <Box component="form" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2, mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Marca</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.marca}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Modelo</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.modelo}</Typography>
                      </Box>
                      {vehiculo?.proyecto && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Proyecto</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.proyecto}</Typography>
                        </Box>
                      )}
                      {vehiculo?.operacion && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Operación</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.operacion}</Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="text.secondary">Año</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.anio}</Typography>
                      </Box>
                      {vehiculo?.color && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Color</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.color}</Typography>
                        </Box>
                      )}
                      {vehiculo?.kilometro !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Kilometraje</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{vehiculo.kilometro.toLocaleString()} km</Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No hay datos del vehículo.</Typography>
                  )}
                </Box>
              </Card>
              <Card sx={{ p: 2 }}>
                <Box component="form" sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
                  <TextField label="Código" name="codigo" size="small" value={formValues.codigo} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.codigo.length + 3}ch` } }} />
                  <TextField label="Marca" name="marca" size="small" value={formValues.marca} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.marca.length + 3}ch` } }} />
                  <TextField label="Medida" name="medida" size="small" value={formValues.medida} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.medida.length + 3}ch` } }} />
                  <TextField label="Diseño" name="diseño" size="small" value={formValues.diseño} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.diseño.length + 3}ch` } }} />
                  <TextField label="Posición" name="posicion" size="small" value={formValues.posicion} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.posicion.length + 3}ch` } }} />
                  <TextField label="Kilometro" name="kilometro" type="number" size="small" value={formValues.kilometro} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.kilometro.length + 3}ch` } }} />
                  <TextField label="Remanente" name="remanente" size="small" value={formValues.remanente} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.remanente.length + 3}ch` } }} />
                  <TextField label="Presión de Aire (psi)" name="presion_aire" type="number" size="small" value={formValues.presion_aire ?? ''} onChange={handleInputChange} inputProps={{ min: 0, style: { minWidth: `${(formValues.presion_aire ?? '').toString().length + 3}ch` } }} />
                  <TextField label="Torque (Nm)" name="torque" type="number" size="small" value={formValues.torque ?? ''} onChange={handleInputChange} inputProps={{ min: 0, style: { minWidth: `${(formValues.torque ?? '').toString().length + 3}ch` } }} />
                  <TextField
                    label="Tipo Movimiento"
                    name="tipo_movimiento"
                    size="small"
                    value="INSPECCION"
                    InputProps={{ readOnly: true, style: { minWidth: `${'INSPECCION'.length + 3}ch` } }}
                  />
                  <TextField label="Observación" name="observacion" size="small" multiline minRows={2} value={formValues.observacion} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.observacion.length + 3}ch` } }} sx={{ gridColumn: 'span 2' }} />
                  <TextField label="Estado" name="estado" size="small" value={formValues.estado} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.estado.length + 3}ch` } }} />
                  {/* Campo visual de Fecha de inspección */}
                  <TextField
                    label="Fecha y hora de inspección"
                    name="fecha_inspeccion"
                    size="small"
                    type="datetime-local"
                    value={
                      formValues.fecha_inspeccion || new Date().toISOString().slice(0, 16)
                    }
                    onChange={e => setFormValues(prev => ({ ...prev, fecha_inspeccion: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().slice(0, 16) }}
                    sx={{ gridColumn: 'span 2' }}
                  />
                  
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
                <DiagramaVehiculo 
                  neumaticosAsignados={neumaticosAsignados} 
                  layout="modal" 
                  onPosicionClick={handleSeleccionarNeumatico}
                  onMantenimientoClick={() => {
                    setOpenMantenimiento(true);
                    onClose(); // Cierra el modal de inspección al abrir el de mantenimiento
                  }}
                />
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
      <ModalMantenimientoNeu
        open={openMantenimiento}
        onClose={() => setOpenMantenimiento(false)}
        placa={placa}
        neumaticosAsignados={neumaticosAsignados}
        vehiculo={vehiculo}
      />
    </>
  );
};

export default ModalInpeccionNeu;
