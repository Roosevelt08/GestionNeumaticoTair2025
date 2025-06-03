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
import { useState, useContext, useEffect } from 'react';
import ModalMantenimientoNeu from './modal-mantenimientoNeu';
import { listarNeumaticosAsignados, guardarInspeccion, Neumaticos, obtenerUltimosMovimientosPorCodigo } from '../../../api/Neumaticos';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import { UserContext } from '../../../contexts/user-context';

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
  const { user } = useContext(UserContext) || {};
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
  const [kmError, setKmError] = React.useState(false);
  const [Odometro, setOdometro] = React.useState(0);
  const [remanenteError, setRemanenteError] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [poNeumaticos, setPoNeumaticos] = useState<any[]>([]);
  const [poNeumaticoSeleccionado, setPoNeumaticoSeleccionado] = useState<any | null>(null);
  const [remanenteAsignacion, setRemanenteAsignacion] = useState<number | null>(null);
  const [remanenteUltimoMovimiento, setRemanenteUltimoMovimiento] = useState<number | null>(null);
  const [remanenteAsignacionReal, setRemanenteAsignacionReal] = useState<number | null>(null);
  const initialOdometro = React.useMemo(() => {
    const num = Number(formValues.kilometro);
    return isNaN(num) ? 0 : num;
  }, [formValues.kilometro]);

  // Cargar datos de neu_asignado al abrir el modal
  React.useEffect(() => {
    if (open && placa) {
      listarNeumaticosAsignados(placa)
        .then(setNeuAsignados)
        .catch(() => setNeuAsignados([]));
    }
  }, [open, placa]);

  // Cargar todos los po_neumaticos al abrir el modal (solo una vez)
  useEffect(() => {
    if (open) {
      Neumaticos().then(setPoNeumaticos).catch(() => setPoNeumaticos([]));
    }
  }, [open]);

  // Cuando se selecciona un neumático, llenar el formulario con datos completos de neu_asignado
  const handleSeleccionarNeumatico = async (neumatico: any) => {
    setNeumaticoSeleccionado(neumatico);
    const neuFull = neuAsignados.find(n => n.POSICION === neumatico.POSICION || n.POSICION_NEU === neumatico.POSICION);
    // Buscar datos completos en po_neumaticos por código
    const codigoBuscar = neuFull?.CODIGO_NEU ?? neuFull?.CODIGO ?? neumatico.CODIGO_NEU ?? neumatico.CODIGO ?? '';
    console.log('poNeumaticos:', poNeumaticos);
    console.log('codigoBuscar:', codigoBuscar);
    const poNeu = poNeumaticos.find(n => String(n.CODIGO) === String(codigoBuscar));
    console.log('poNeu encontrado:', poNeu);
    setPoNeumaticoSeleccionado(poNeu || null);
    // Obtener el último movimiento real desde el backend
    let remanenteUltimoMovimiento = '';
    let presionUltimoMovimiento = '';
    let torqueUltimoMovimiento = '';
    let kilometroUltimoMovimiento = '';
    try {
      const movimientos = await obtenerUltimosMovimientosPorCodigo(codigoBuscar);
      if (Array.isArray(movimientos) && movimientos.length > 0) {
        const mov = movimientos[0];
        remanenteUltimoMovimiento = mov?.REMANENTE?.toString() ?? '';
        presionUltimoMovimiento = mov?.PRESION_AIRE?.toString() ?? '';
        torqueUltimoMovimiento = mov?.TORQUE_APLICADO?.toString() ?? '';
        kilometroUltimoMovimiento = mov?.KILOMETRO?.toString() ?? '';
        // Buscar el movimiento de ASIGNACION más reciente
        const asignacion = movimientos.find((m: any) => m.TIPO_MOVIMIENTO === 'ASIGNADO' || m.TIPO_MOVIMIENTO === 'ASIGNACION');
        setRemanenteAsignacionReal(asignacion ? Number(asignacion.REMANENTE) : null);
      } else {
        remanenteUltimoMovimiento = neuFull?.REMANENTE?.toString() ?? neumatico.REMANENTE?.toString() ?? '';
        presionUltimoMovimiento = neuFull?.PRESION_AIRE?.toString() ?? neumatico.PRESION_AIRE?.toString() ?? '';
        torqueUltimoMovimiento = neuFull?.TORQUE_APLICADO?.toString() ?? neumatico.TORQUE_APLICADO?.toString() ?? '';
        kilometroUltimoMovimiento = neuFull?.KILOMETRO?.toString() ?? neumatico.KILOMETRO?.toString() ?? '';
        // Si no hay movimientos de asignación, usar el REMANENTE de poNeumaticos como referencia inicial
        setRemanenteAsignacionReal(poNeu?.REMANENTE !== undefined ? Number(poNeu.REMANENTE) : null);
      }
    } catch (e) {
      remanenteUltimoMovimiento = neuFull?.REMANENTE?.toString() ?? neumatico.REMANENTE?.toString() ?? '';
      presionUltimoMovimiento = neuFull?.PRESION_AIRE?.toString() ?? neumatico.PRESION_AIRE?.toString() ?? '';
      torqueUltimoMovimiento = neuFull?.TORQUE_APLICADO?.toString() ?? neumatico.TORQUE_APLICADO?.toString() ?? '';
      kilometroUltimoMovimiento = neuFull?.KILOMETRO?.toString() ?? neumatico.KILOMETRO?.toString() ?? '';
      // Si hay error, usar el REMANENTE de poNeumaticos como referencia inicial
      setRemanenteAsignacionReal(poNeu?.REMANENTE !== undefined ? Number(poNeu.REMANENTE) : null);
    }
    setRemanenteUltimoMovimiento(remanenteUltimoMovimiento ? Number(remanenteUltimoMovimiento) : null);
    setFormValues({
      kilometro: kilometroUltimoMovimiento || (neuFull?.ODOMETRO?.toString() ?? neuFull?.KILOMETRO?.toString() ?? ''),
      marca: neuFull?.MARCA ?? neumatico.MARCA ?? '',
      modelo: neuFull?.MODELO ?? neumatico.MODELO ?? '',
      codigo: codigoBuscar,
      posicion: neuFull?.POSICION ?? neumatico.POSICION ?? '',
      medida: neuFull?.MEDIDA ?? neumatico.MEDIDA ?? '',
      diseño: neuFull?.DISEÑO ?? neumatico.DISEÑO ?? '',
      remanente: remanenteUltimoMovimiento,
      tipo_movimiento: 'INSPECCION',
      estado: neuFull?.ESTADO ?? neumatico.ESTADO ?? '',
      observacion: neuFull?.OBSERVACION ?? neumatico.OBSERVACION ?? '',
      presion_aire: presionUltimoMovimiento,
      torque: torqueUltimoMovimiento,
      fecha_inspeccion: '',
    });
    setOdometro(Number(kilometroUltimoMovimiento || neuFull?.ODOMETRO || neuFull?.KILOMETRO || 0));
    setKmError(false);
    setRemanenteError(false);
    // Buscar el remanente de la última ASIGNACIÓN (puede seguir igual)
    let remanenteRef = null;
    if (neuFull?.MOVIMIENTOS && Array.isArray(neuFull.MOVIMIENTOS)) {
      const asignacion = neuFull.MOVIMIENTOS.filter((m: any) => m.TIPO_MOVIMIENTO === 'ASIGNACION')
        .sort((a: any, b: any) => new Date(b.FECHA_MOVIMIENTO).getTime() - new Date(a.FECHA_MOVIMIENTO).getTime())[0];
      remanenteRef = asignacion?.REMANENTE ?? null;
    }
    setRemanenteAsignacion(remanenteRef !== null ? Number(remanenteRef) : (poNeu?.REMANENTE !== undefined ? Number(poNeu.REMANENTE) : Number(neuFull?.REMANENTE ?? neumatico.REMANENTE ?? 0)));
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

  // Sincronizar Odometro con el valor inicial al abrir modal o cambiar neumático
  React.useEffect(() => {
    setOdometro(initialOdometro);
    setKmError(false);
  }, [initialOdometro]);

  // Calcular el porcentaje de remanente respecto a la última ASIGNACIÓN REAL
  const valorReferenciaRemanente = remanenteAsignacionReal !== null ? remanenteAsignacionReal : (remanenteAsignacion ?? Number(neumaticoSeleccionado?.REMANENTE));
  const valorActualRemanente = Number(formValues.remanente);
  const porcentajeRemanente =
    valorReferenciaRemanente > 0 && !isNaN(valorActualRemanente)
      ? ((valorActualRemanente * 100) / valorReferenciaRemanente).toFixed(2) + '%'
      : '';

  const handleGuardarInspeccion = async () => {
    if (Odometro < Number(formValues.kilometro)) {
      setSnackbar({ open: true, message: `El número de kilometro no puede ser menor al actual (${formValues.kilometro} km).`, severity: 'error' });
      return;
    }
    if (remanenteError) {
      setSnackbar({ open: true, message: `El valor de remanente no puede ser mayor a ${valorReferenciaRemanente}` , severity: 'error' });
      return;
    }
    if (!neumaticoSeleccionado) {
      setSnackbar({ open: true, message: 'Debe seleccionar un neumático.', severity: 'error' });
      return;
    }
    // Validar que poNeumaticoSeleccionado esté presente
    if (!poNeumaticoSeleccionado) {
      setSnackbar({ open: true, message: 'No se encontraron los datos completos del neumático.', severity: 'error' });
      return;
    }
    // Fechas
    const now = new Date();
    const fechaActual = now.toISOString();
    const fechaInspeccion = formValues.fecha_inspeccion ? new Date(formValues.fecha_inspeccion).toISOString() : fechaActual;
    // Armar el payload completo
    // Formatear fechas para campos tipo DATE (YYYY-MM-DD)
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    };
    // Formatear TIMESTAMP (formato DB2: 'YYYY-MM-DD HH:mm:ss')
    const formatTimestamp = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      // Reemplazar 'T' por espacio y quitar milisegundos
      return d.toISOString().slice(0, 19).replace('T', ' ');
    };
    // Estado como decimal (porcentaje con decimales, por ejemplo 94.44)
    const estadoDecimal = (() => {
      const val = porcentajeRemanente?.toString().replace('%', '').trim();
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    })();
    const datosEnviar = {
      // ID_INSPECCION eliminado, lo maneja la base de datos
      CODIGO: String(formValues.codigo || ''),
      MARCA: String(formValues.marca || ''),
      MEDIDA: String(formValues.medida || ''),
      DISEÑO: String(formValues.diseño || ''),
      REMANENTE: parseInt(formValues.remanente) || 0,
      PR: String(poNeumaticoSeleccionado.PR || ''),
      CARGA: String(poNeumaticoSeleccionado.CARGA || ''),
      VELOCIDAD: String(poNeumaticoSeleccionado.VELOCIDAD || ''),
      FECHA_FABRICACION: String(poNeumaticoSeleccionado.FECHA_FABRICACION_COD || ''),
      RQ: String(poNeumaticoSeleccionado.RQ || ''),
      OC: String(poNeumaticoSeleccionado.OC || ''),
      PROYECTO: String(vehiculo?.proyecto || ''),
      COSTO: poNeumaticoSeleccionado.COSTO ? parseFloat(poNeumaticoSeleccionado.COSTO) : 0,
      OBSERVACION: String(formValues.observacion || ''),
      PROVEEDOR: String(poNeumaticoSeleccionado.PROVEEDOR || ''),
      FECHA_REGISTRO: formatDate(formValues.fecha_inspeccion) || formatDate(new Date().toISOString()),
      FECHA_COMPRA: formatDate(poNeumaticoSeleccionado.FECHA_COMPRA),
      USUARIO_SUPER: String(user?.name || user?.usuario || ''),
      TIPO_MOVIMIENTO: String(formValues.tipo_movimiento || ''),
      PRESION_AIRE: formValues.presion_aire ? parseFloat(formValues.presion_aire) : 0,
      TORQUE_APLICADO: formValues.torque ? parseFloat(formValues.torque) : 0,
      ESTADO: estadoDecimal,
      PLACA: String(placa || ''),
      POSICION_NEU: String(formValues.posicion || ''),
      FECHA_ASIGNACION: formatDate(new Date().toISOString()),
      KILOMETRO: formValues.kilometro ? parseInt(formValues.kilometro) : 0,
      FECHA_MOVIMIENTO: formatTimestamp(new Date().toISOString()),
    };
    console.log('Datos enviados a guardarInspeccion:', datosEnviar);
    console.log('Payload FINAL enviado a guardarInspeccion (formato backend):', JSON.stringify(datosEnviar, null, 2));
    try {
      await guardarInspeccion(datosEnviar);
      setSnackbar({ open: true, message: 'Inspección guardada correctamente.', severity: 'success' });
      onClose();
    } catch (error: any) {
      const msg = error?.message || 'Error al guardar la inspección.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

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
                  <TextField label="Código" name="codigo" size="small" value={formValues.codigo} inputProps={{ readOnly: true, style: { minWidth: `${formValues.codigo.length + 3}ch` } }} />
                  <TextField label="Marca" name="marca" size="small" value={formValues.marca} inputProps={{ readOnly: true, style: { minWidth: `${formValues.marca.length + 3}ch` } }} />
                  <TextField label="Medida" name="medida" size="small" value={formValues.medida} inputProps={{ readOnly: true, style: { minWidth: `${formValues.medida.length + 3}ch` } }} />
                  <TextField label="Diseño" name="diseño" size="small" value={formValues.diseño} inputProps={{ readOnly: true, style: { minWidth: `${formValues.diseño.length + 3}ch` } }} />
                  <TextField label="Posición" name="posicion" size="small" value={formValues.posicion} inputProps={{ readOnly: true, style: { minWidth: `${formValues.posicion.length + 3}ch` } }} />
                  <TextField
                    label="Kilometro"
                    type="number"
                    name="kilometro"
                    size="small"
                    value={Odometro}
                    onChange={e => {
                      const value = Number(e.target.value);
                      setOdometro(value);
                      setFormValues(prev => ({ ...prev, kilometro: value.toString() }));
                      setKmError(value < initialOdometro);
                    }}
                    error={kmError}
                    helperText={
                      kmError
                        ? `No puede ser menor a ${initialOdometro.toLocaleString()} km`
                        : `Kilometro: ${initialOdometro.toLocaleString()} km`
                    }
                    InputProps={{
                      inputProps: { min: initialOdometro },
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
                    fullWidth
                  />
                  <TextField
                    label="Remanente"
                    name="remanente"
                    size="small"
                    value={formValues.remanente}
                    onChange={e => {
                      const value = e.target.value;
                      setFormValues(prev => ({ ...prev, remanente: value }));
                      // Validar contra el remanente original Y el último remanente registrado
                      const valueNum = Number(value);
                      const error = (
                        (remanenteAsignacionReal !== undefined && remanenteAsignacionReal !== null && valueNum > Number(remanenteAsignacionReal)) ||
                        (remanenteUltimoMovimiento !== undefined && remanenteUltimoMovimiento !== null && valueNum > Number(remanenteUltimoMovimiento))
                      );
                      setRemanenteError(error);
                    }}
                    error={remanenteError}
                    helperText={
                      remanenteError
                        ? `Solo puedes ingresar un valor igual o menor al remanente original (${remanenteAsignacionReal ?? poNeumaticoSeleccionado?.REMANENTE ?? '-'}) y al último registrado (${remanenteUltimoMovimiento ?? '-'})`
                        : `Remanente original: ${remanenteAsignacionReal ?? poNeumaticoSeleccionado?.REMANENTE ?? '-'}`
                    }
                    inputProps={{ style: { minWidth: `${formValues.remanente.length + 3}ch` } }}
                  />
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
                  <TextField label="Estado" name="estado" size="small" value={porcentajeRemanente} inputProps={{ readOnly: true, style: { minWidth: `${porcentajeRemanente.length + 3}ch` } }} />
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
          <Button color="success" variant="contained" sx={{ ml: 1 }} onClick={handleGuardarInspeccion}>
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
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ModalInpeccionNeu;
