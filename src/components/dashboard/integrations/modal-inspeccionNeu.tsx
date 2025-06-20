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

// --- Declaraciones de tipos fuera del componente ---
interface FormValues {
  kilometro: string;
  marca: string;
  modelo: string;
  codigo: string;
  posicion: string;
  medida: string;
  diseño: string;
  remanente: string;
  tipo_movimiento: string;
  estado: string;
  observacion: string;
  presion_aire: string;
  torque: string;
  fecha_inspeccion: string;
}
type SnackbarSeverity = 'success' | 'error' | 'info';

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
  onUpdateAsignados?: () => void; // NUEVO: callback para refrescar asignados
}

const ModalInpeccionNeu: React.FC<ModalInpeccionNeuProps> = ({ open, onClose, placa, neumaticosAsignados, vehiculo, onSeleccionarNeumatico, onUpdateAsignados }) => {
  const { user } = useContext(UserContext) || {};
  const [neumaticoSeleccionado, setNeumaticoSeleccionado] = useState<any | null>(null);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: SnackbarSeverity }>({ open: false, message: '', severity: 'success' });
  const [formValues, setFormValues] = React.useState<FormValues>({
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
  // Estado para la lista de neumáticos asignados (siempre actualizada)
  const [neuAsignados, setNeuAsignados] = React.useState<any[]>([]);
  const [kmError, setKmError] = React.useState(false);
  const [Odometro, setOdometro] = React.useState(0);
  const [remanenteError, setRemanenteError] = React.useState(false);
  const [remanenteAsignacion, setRemanenteAsignacion] = useState<number | null>(null);
  const [remanenteUltimoMovimiento, setRemanenteUltimoMovimiento] = useState<number | null>(null);
  const [remanenteAsignacionReal, setRemanenteAsignacionReal] = useState<number | null>(null);
  const initialOdometro = React.useMemo(() => {
    const num = Number(formValues.kilometro);
    return isNaN(num) ? 0 : num;
  }, [formValues.kilometro]);

  // Estado local para inspecciones pendientes
  const [inspeccionesPendientes, setInspeccionesPendientes] = useState<any[]>([]);
  // Estado para el formulario inicial (para comparar cambios)
  const [formValuesInicial, setFormValuesInicial] = React.useState<FormValues | null>(null);

  // Estado para todos los po_neumaticos (debe estar definido)
  const [poNeumaticos, setPoNeumaticos] = useState<any[]>([]);
  // Estado para el po_neumatico seleccionado (debe estar definido)
  const [poNeumaticoSeleccionado, setPoNeumaticoSeleccionado] = useState<any | null>(null);

  // Estado para mostrar modal de inspección ya realizada
  const [showInspeccionHoy, setShowInspeccionHoy] = useState(false);
  const [bloquearFormulario, setBloquearFormulario] = useState(false);
  const [alertaInspeccionHoy, setAlertaInspeccionHoy] = useState(false); // NUEVO

  // Estado para controlar si ya se inspeccionó hoy
  const [inspeccionHoyRealizada, setInspeccionHoyRealizada] = useState(false);

  // Estado para la fecha mínima de inspección (no puede ser menor a la última registrada)
  const [fechaMinimaInspeccion, setFechaMinimaInspeccion] = useState<string | null>(null);
  const [fechaInspeccionError, setFechaInspeccionError] = useState<string | null>(null);

  // Estado para la fecha de asignación original (mínimo de inspección)
  const [fechaAsignacionOriginal, setFechaAsignacionOriginal] = useState<string | null>(null);

  // Obtener la fecha de hoy en formato yyyy-mm-dd
  const hoy = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Cargar datos de neu_asignado al abrir el modal o cuando cambie la placa
  React.useEffect(() => {
    if (open && placa) {
      listarNeumaticosAsignados(placa)
        .then((data) => {
          setNeuAsignados(data || []);
          console.log('neuAsignados después de listarNeumaticosAsignados:', data);
          // Limpiar selección y formulario si los asignados cambian
          setNeumaticoSeleccionado(null);
          setFormValues({
            kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: '', tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
          });
          setFormValuesInicial(null);
        })
        .catch(() => {
          setNeuAsignados([]);
          setNeumaticoSeleccionado(null);
          setFormValues({
            kilometro: '', marca: '', modelo: '', codigo: '', posicion: '', medida: '', diseño: '', remanente: '', presion_aire: '', torque: '', tipo_movimiento: '', estado: '', observacion: '', fecha_inspeccion: '',
          });
          setFormValuesInicial(null);
        });
    }
  }, [open, placa]);

  // Cargar todos los po_neumaticos al abrir el modal (solo una vez)
  useEffect(() => {
    if (open) {
      Neumaticos().then(setPoNeumaticos).catch(() => setPoNeumaticos([]));
    }
  }, [open]);

  // Verificar si ya existe inspección hoy al abrir el modal
  useEffect(() => {
    if (open && placa) {
      // Simulación solo frontend: mostrar alerta siempre que se abra el modal
      setAlertaInspeccionHoy(true);
      setBloquearFormulario(true);
      // Si quieres que solo se muestre una vez por día, puedes guardar en localStorage con la fecha
    }
  }, [open, placa]);

  // Cuando se selecciona un neumático, llenar el formulario con datos completos de neu_asignado
  const handleSeleccionarNeumatico = async (neumatico: any) => {
    console.log('neumatico clickeado:', neumatico);
    console.log('neuAsignados en handleSeleccionarNeumatico:', neuAsignados);
    // Buscar el neumático realmente asignado a la posición clickeada Y con el mismo código
    const neuActual = neuAsignados.find(
      n =>
        (n.POSICION === neumatico.POSICION || n.POSICION_NEU === neumatico.POSICION) &&
        (n.CODIGO === neumatico.CODIGO)
    );
    console.log('neuActual encontrado:', neuActual);
    const neuFull = neuActual || neumatico; // Usar el asignado, o el recibido si no hay
    setNeumaticoSeleccionado(neuFull);
    // Buscar datos completos en po_neumaticos por código
    const codigoBuscar = neuFull?.CODIGO_NEU ?? neuFull?.CODIGO ?? '';
    const poNeu = poNeumaticos.find(n => String(n.CODIGO) === String(codigoBuscar));
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
        // Obtener la última FECHA_REGISTRO (puede ser FECHA_REGISTRO o FECHA_MOVIMIENTO)
        const fechas = movimientos
          .map((m: any) => m.FECHA_REGISTRO || m.FECHA_MOVIMIENTO)
          .filter(Boolean)
          .map((f: string) => new Date(f));
        if (fechas.length > 0) {
          const maxFecha = new Date(Math.max(...fechas.map(f => f.getTime())));
          setFechaMinimaInspeccion(maxFecha.toISOString().slice(0, 10));
        } else {
          setFechaMinimaInspeccion(null);
        }
      } else {
        remanenteUltimoMovimiento = neuFull?.REMANENTE?.toString() ?? '';
        presionUltimoMovimiento = neuFull?.PRESION_AIRE?.toString() ?? '';
        torqueUltimoMovimiento = neuFull?.TORQUE_APLICADO?.toString() ?? '';
        kilometroUltimoMovimiento = neuFull?.KILOMETRO?.toString() ?? '';
        setRemanenteAsignacionReal(poNeu?.REMANENTE !== undefined ? Number(poNeu.REMANENTE) : null);
        // Si no hay movimientos, usar la fecha de asignación si existe
        const fechaAsignado = neuFull?.FECHA_ASIGNACION || neuFull?.FECHA_REGISTRO;
        if (fechaAsignado) {
          setFechaMinimaInspeccion(new Date(fechaAsignado).toISOString().slice(0, 10));
        } else {
          setFechaMinimaInspeccion(null);
        }
      }
    } catch (e) {
      remanenteUltimoMovimiento = neuFull?.REMANENTE?.toString() ?? '';
      presionUltimoMovimiento = neuFull?.PRESION_AIRE?.toString() ?? '';
      torqueUltimoMovimiento = neuFull?.TORQUE_APLICADO?.toString() ?? '';
      kilometroUltimoMovimiento = neuFull?.KILOMETRO?.toString() ?? '';
      setRemanenteAsignacionReal(poNeu?.REMANENTE !== undefined ? Number(poNeu.REMANENTE) : null);
      const fechaAsignado = neuFull?.FECHA_ASIGNACION || neuFull?.FECHA_REGISTRO;
      if (fechaAsignado) {
        setFechaMinimaInspeccion(new Date(fechaAsignado).toISOString().slice(0, 10));
      } else {
        setFechaMinimaInspeccion(null);
      }
    }
    setRemanenteUltimoMovimiento(remanenteUltimoMovimiento ? Number(remanenteUltimoMovimiento) : null);
    setFormValues({
      kilometro: kilometroUltimoMovimiento || (neuFull?.ODOMETRO?.toString() ?? neuFull?.KILOMETRO?.toString() ?? ''),
      marca: neuFull?.MARCA ?? '',
      modelo: neuFull?.MODELO ?? '',
      codigo: codigoBuscar,
      posicion: neuFull?.POSICION ?? neuFull?.POSICION_NEU ?? '',
      medida: neuFull?.MEDIDA ?? '',
      diseño: neuFull?.DISEÑO ?? '',
      remanente: remanenteUltimoMovimiento,
      tipo_movimiento: 'INSPECCION',
      estado: neuFull?.ESTADO ?? '',
      observacion: neuFull?.OBSERVACION ?? '',
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
    setRemanenteAsignacion(remanenteRef !== null ? Number(remanenteRef) : (poNeu?.REMANENTE !== undefined ? Number(poNeu.REMANENTE) : Number(neuFull?.REMANENTE ?? 0)));
    if (onSeleccionarNeumatico) onSeleccionarNeumatico(neuFull);
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

  // Cuando se selecciona un neumático, guardar el estado inicial del formulario
  useEffect(() => {
    if (neumaticoSeleccionado) {
      setFormValuesInicial(formValues);
    }
    // eslint-disable-next-line
  }, [neumaticoSeleccionado]);

  // Función para comparar si hay cambios en el formulario respecto al inicial
  const hayCambiosFormulario = React.useMemo(() => {
    if (!formValuesInicial) return false;
    // Compara solo los campos relevantes
    const campos: (keyof FormValues)[] = [
      'kilometro', 'remanente', 'presion_aire', 'torque', 'observacion', 'fecha_inspeccion'
    ];
    return campos.some(c => String(formValues[c] ?? '') !== String(formValuesInicial[c] ?? ''));
  }, [formValues, formValuesInicial]);

  // Guardar inspección localmente (no envía al backend)
  const handleGuardarInspeccionLocal = () => {
    if (!neumaticoSeleccionado) {
      setSnackbar({ open: true, message: 'Debe seleccionar un neumático.', severity: 'error' });
      return;
    }
    if (fechaMinimaInspeccion && (formValues.fecha_inspeccion < fechaMinimaInspeccion)) {
      setSnackbar({ open: true, message: `La fecha de inspección no puede ser menor a la última registrada: ${fechaMinimaInspeccion}`, severity: 'error' });
      return;
    }
    if (!hayCambiosFormulario) {
      setSnackbar({ open: true, message: 'No hay cambios para guardar.', severity: 'info' });
      return;
    }
    // Validaciones mínimas
    if (Odometro < Number(formValues.kilometro)) {
      setSnackbar({ open: true, message: `El número de kilometro no puede ser menor al actual (${formValues.kilometro} km).`, severity: 'error' });
      return;
    }
    if (remanenteError) {
      setSnackbar({ open: true, message: `El valor de remanente no puede ser mayor a ${valorReferenciaRemanente}` , severity: 'error' });
      return;
    }
    // Buscar la fecha de asignación original para este neumático
    let fechaAsignacion = null;
    if (neumaticoSeleccionado?.FECHA_ASIGNACION) {
      fechaAsignacion = neumaticoSeleccionado.FECHA_ASIGNACION;
    } else if (neumaticoSeleccionado?.MOVIMIENTOS && Array.isArray(neumaticoSeleccionado.MOVIMIENTOS)) {
      const movAsign = neumaticoSeleccionado.MOVIMIENTOS.filter((m: any) => m.TIPO_MOVIMIENTO === 'ASIGNADO' || m.TIPO_MOVIMIENTO === 'ASIGNACION')
        .sort((a: any, b: any) => new Date(b.FECHA_MOVIMIENTO).getTime() - new Date(a.FECHA_MOVIMIENTO).getTime())[0];
      fechaAsignacion = movAsign?.FECHA_ASIGNACION || movAsign?.FECHA_REGISTRO || null;
    }
    // Guardar/actualizar inspección localmente por posición, incluyendo la fecha de asignación
    const nuevaInspeccion = { ...formValues, fecha_asignacion: fechaAsignacion ? new Date(fechaAsignacion).toISOString().slice(0, 10) : null };
    setInspeccionesPendientes(prev => {
      const idx = prev.findIndex(i => i.posicion === nuevaInspeccion.posicion);
      let nuevoArray;
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = nuevaInspeccion;
        nuevoArray = copia;
      } else {
        nuevoArray = [...prev, nuevaInspeccion];
      }
      console.log('Inspecciones guardadas localmente:', nuevoArray);
      return nuevoArray;
    });
    setFormValuesInicial({ ...formValues });
    setSnackbar({ open: true, message: 'Inspección guardada localmente.', severity: 'success' });
  };

  // Enviar todas las inspecciones pendientes al backend
  const handleEnviarYGuardar = async () => {
    if (inspeccionesPendientes.length !== 4) {
      setSnackbar({ open: true, message: 'Debe inspeccionar los 4 neumáticos antes de enviar.', severity: 'error' });
      return;
    }
    // --- LOG para ver el array antes de enviar ---
    // El array que se envía al backend debe tener la estructura final, no el array local crudo
    const now = new Date();
    const fechaActual = now.toISOString();
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    };
    const formatTimestamp = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 19).replace('T', 'T'); // Mantener formato ISO
    };
    // Utilidad para obtener fecha/hora local en formato YYYY-MM-DD HH:mm:ss
    const getLocalDateTimeString = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const payloads = inspeccionesPendientes.map(ins => {
      const poNeu = poNeumaticos.find(n => String(n.CODIGO) === String(ins.codigo));
      const remanente = ins.remanente ? parseFloat(ins.remanente) : 0;
      const referencia = poNeu?.REMANENTE ? parseFloat(poNeu.REMANENTE) : 0;
      const estadoDecimal = referencia > 0 ? Math.round((remanente * 100) / referencia) : null;
      // Usar la fecha de asignación guardada en la inspección, o la de poNeu si no existe
      let fechaAsignacion = ins.fecha_asignacion;
      if (!fechaAsignacion && poNeu?.FECHA_ASIGNACION) fechaAsignacion = poNeu.FECHA_ASIGNACION;
      // Construir el objeto en el orden exacto esperado por el backend, usando null en vez de string vacío
      const obj = {
        CARGA: poNeu?.CARGA ?? null,
        CODIGO: ins.codigo ?? null,
        COSTO: poNeu?.COSTO ? parseFloat(poNeu.COSTO) : null,
        DISEÑO: ins.diseño ?? null,
        ESTADO: estadoDecimal,
        FECHA_ASIGNACION: fechaAsignacion || null,
        FECHA_COMPRA: formatDate(poNeu?.FECHA_COMPRA) || null,
        FECHA_FABRICACION: poNeu?.FECHA_FABRICACION_COD ?? null,
        FECHA_MOVIMIENTO: getLocalDateTimeString(),
        FECHA_REGISTRO: formatDate(ins.fecha_inspeccion) || formatDate(new Date().toISOString()) || null,
        KILOMETRO: ins.kilometro ? parseInt(ins.kilometro) : null,
        MARCA: ins.marca ?? null,
        MEDIDA: ins.medida ?? null,
        OBSERVACION: ins.observacion ?? null,
        OC: poNeu?.OC ?? null,
        PLACA: placa ?? null,
        POSICION_NEU: ins.posicion ?? null,
        PR: poNeu?.PR ?? null,
        PRESION_AIRE: ins.presion_aire ? parseFloat(ins.presion_aire) : null,
        PROVEEDOR: poNeu?.PROVEEDOR ?? null,
        PROYECTO: vehiculo?.proyecto ?? null,
        REMANENTE: ins.remanente ? parseInt(ins.remanente) : null,
        RQ: poNeu?.RQ ?? null,
        TIPO_MOVIMIENTO: ins.tipo_movimiento ?? null,
        TORQUE_APLICADO: ins.torque ? parseFloat(ins.torque) : null,
        USUARIO_SUPER: user?.name || user?.usuario || null,
        VELOCIDAD: poNeu?.VELOCIDAD ?? null,
      };
      return obj;
    });
    if (payloads.length > 0) {
      console.log('Claves del primer objeto del payload:', Object.keys(payloads[0]));
    }
    console.log('Payload FINAL a enviar al backend:', payloads);
    try {
      await guardarInspeccion(payloads); // El backend acepta array
      setSnackbar({ open: true, message: 'Inspecciones enviadas correctamente.', severity: 'success' });
      setInspeccionesPendientes([]);
      if (onUpdateAsignados) onUpdateAsignados();
      marcarInspeccionHoy(); // Marcar inspección realizada hoy
      onClose();
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || 'Error al enviar inspecciones.', severity: 'error' });
    }
  };

  // Guardar en localStorage la fecha de la última inspección exitosa
  const marcarInspeccionHoy = () => {
    const hoy = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`inspeccion_${placa}`, hoy);
    setInspeccionHoyRealizada(true);
  };

  // Al abrir el modal, verificar si ya se inspeccionó hoy
  useEffect(() => {
    if (open && placa) {
      const hoy = new Date().toISOString().slice(0, 10);
      const ultima = localStorage.getItem(`inspeccion_${placa}`);
      if (ultima === hoy) {
        setAlertaInspeccionHoy(true);
        setBloquearFormulario(true);
        setInspeccionHoyRealizada(true);
      } else {
        setAlertaInspeccionHoy(false);
        setBloquearFormulario(false);
        setInspeccionHoyRealizada(false);
      }
    }
  }, [open, placa]);

  // Escuchar el evento global para abrir el modal desde DiagramaVehiculo
  React.useEffect(() => {
    const handler = () => {
      if (!open) {
        // Si el modal no está abierto, lo abre
        if (typeof onClose === 'function') onClose(); // Cierra si está abierto (por seguridad)
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const evt = new CustomEvent('abrir-modal-inspeccion-interno');
            window.dispatchEvent(evt);
          }
        }, 100);
      }
    };
    window.addEventListener('abrir-modal-inspeccion', handler);
    return () => window.removeEventListener('abrir-modal-inspeccion', handler);
  }, [open, onClose]);

  return (
    <>
      <Dialog open={alertaInspeccionHoy} onClose={() => setAlertaInspeccionHoy(false)}>
        <DialogTitle>¡Atención!</DialogTitle>
        <DialogContent>
          <Typography>Ya se registró una inspección para este vehículo hoy.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Si necesitas hacer otra inspección, presiona Continuar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAlertaInspeccionHoy(false); setBloquearFormulario(false); }} color="primary" variant="contained">
            Continuar inspección
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={showInspeccionHoy} onClose={() => setShowInspeccionHoy(false)}>
        <DialogTitle>Inspección ya realizada</DialogTitle>
        <DialogContent>
          <Typography>Hoy ya se realizó una inspección para este vehículo.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Si desea modificar la inspección, presione "Continuar inspección".</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowInspeccionHoy(false); setBloquearFormulario(false); }} color="primary" variant="contained">
            Continuar inspección
          </Button>
          <Button onClick={onClose} color="secondary" variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
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
                  <TextField label="Código" name="codigo" size="small" value={formValues.codigo} inputProps={{ readOnly: true, style: { minWidth: `${formValues.codigo.length + 3}ch` } }} disabled={bloquearFormulario} />
                  <TextField label="Marca" name="marca" size="small" value={formValues.marca} inputProps={{ readOnly: true, style: { minWidth: `${formValues.marca.length + 3}ch` } }} disabled={bloquearFormulario} />
                  <TextField label="Medida" name="medida" size="small" value={formValues.medida} inputProps={{ readOnly: true, style: { minWidth: `${formValues.medida.length + 3}ch` } }} disabled={bloquearFormulario} />
                  <TextField label="Diseño" name="diseño" size="small" value={formValues.diseño} inputProps={{ readOnly: true, style: { minWidth: `${formValues.diseño.length + 3}ch` } }} disabled={bloquearFormulario} />
                  <TextField label="Posición" name="posicion" size="small" value={formValues.posicion} inputProps={{ readOnly: true, style: { minWidth: `${formValues.posicion.length + 3}ch` } }} disabled={bloquearFormulario} />
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
                    disabled={bloquearFormulario}
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
                    disabled={bloquearFormulario}
                  />
                  <TextField label="Presión de Aire (psi)" name="presion_aire" type="number" size="small" value={formValues.presion_aire ?? ''} onChange={handleInputChange} inputProps={{ min: 0, style: { minWidth: `${(formValues.presion_aire ?? '').toString().length + 3}ch` } }} disabled={bloquearFormulario} />
                  <TextField label="Torque (Nm)" name="torque" type="number" size="small" value={formValues.torque ?? ''} onChange={handleInputChange} inputProps={{ min: 0, style: { minWidth: `${(formValues.torque ?? '').toString().length + 3}ch` } }} disabled={bloquearFormulario} />
                  <TextField
                    label="Tipo Movimiento"
                    name="tipo_movimiento"
                    size="small"
                    value="INSPECCION"
                    InputProps={{ readOnly: true, style: { minWidth: `${'INSPECCION'.length + 3}ch` } }}
                    disabled={bloquearFormulario}
                  />
                  <TextField label="Observación" name="observacion" size="small" multiline minRows={2} value={formValues.observacion} onChange={handleInputChange} inputProps={{ style: { minWidth: `${formValues.observacion.length + 3}ch` } }} sx={{ gridColumn: 'span 2' }} disabled={bloquearFormulario} />
                  <TextField label="Estado" name="estado" size="small" value={porcentajeRemanente} inputProps={{ readOnly: true, style: { minWidth: `${porcentajeRemanente.length + 3}ch` } }} disabled={bloquearFormulario} />
                  <TextField
                    label="Fecha de inspección"
                    name="fecha_inspeccion"
                    size="small"
                    type="date"
                    value={
                      formValues.fecha_inspeccion || hoy
                    }
                    onChange={e => {
                      const value = e.target.value;
                      setFormValues(prev => ({ ...prev, fecha_inspeccion: value }));
                      if (fechaAsignacionOriginal && value < fechaAsignacionOriginal) {
                        setFechaInspeccionError(`No puede ser menor a la fecha de asignación: ${fechaAsignacionOriginal}`);
                      } else if (value > hoy) {
                        setFechaInspeccionError(`No puede ser mayor a la fecha de hoy: ${hoy}`);
                      } else {
                        setFechaInspeccionError(null);
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: fechaAsignacionOriginal || undefined,
                      max: hoy
                    }}
                    sx={{ gridColumn: 'span 2' }}
                    disabled={bloquearFormulario}
                    error={!!fechaInspeccionError}
                    helperText={fechaInspeccionError || (fechaAsignacionOriginal ? `Solo fechas entre ${fechaAsignacionOriginal} y ${hoy}` : undefined)}
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
          <Button color="secondary" variant="outlined" onClick={handleGuardarInspeccionLocal} disabled={!hayCambiosFormulario || bloquearFormulario}>
            Guardar inspección
          </Button>
          <Button color="success" variant="contained" sx={{ ml: 1 }} onClick={handleEnviarYGuardar} disabled={inspeccionesPendientes.length !== 4 || bloquearFormulario}>
            Enviar y Guardar
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
