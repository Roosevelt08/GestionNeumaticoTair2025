import * as React from 'react';
import { useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { useUser } from '@/hooks/use-user';

import { obtenerUltimosMovimientosPorCodigo, registrarReubicacionNeumatico, registrarDesasignacionNeumatico } from '../../../api/Neumaticos';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';

// Ampliar la interfaz para evitar errores de propiedades
interface Neumatico {
    POSICION: string;
    CODIGO_NEU?: string;
    CODIGO?: string;
    POSICION_NEU?: string;
    ESTADO?: string | number;
    ID_MOVIMIENTO?: number | string;
    TIPO_MOVIMIENTO?: string;
    MARCA?: string;
    MEDIDA?: string;
    DISEÑO?: string;
    REMANENTE?: string | number;
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
}

interface ModalInpeccionNeuProps {
    open: boolean;
    onClose: () => void;
    placa: string;
    neumaticosAsignados: Neumatico[];
    vehiculo?: Vehiculo;
    onSeleccionarNeumatico?: (neumatico: any) => void; // NUEVO
}

const ModalInpeccionNeu: React.FC<ModalInpeccionNeuProps> = ({
    open,
    onClose,
    placa,
    neumaticosAsignados,
    vehiculo,
    onSeleccionarNeumatico,
}) => {
    const { user } = useUser();
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
        presion_aire: '',
        torque: '',
        tipo_movimiento: '',
        estado: '',
        observacion: '',
        fecha_inspeccion: '',
        accion: '', // <-- Añadido para el select de acción
    });

    // Estado local para los neumáticos asignados (para poder actualizar al hacer drop)
    const [neumaticosAsignadosState, setNeumaticosAsignadosState] = useState<Neumatico[]>(neumaticosAsignados);

    // Estado para la acción seleccionada (REUBICADO o DESASIGNAR)
    const [accion, setAccion] = useState<'REUBICADO' | 'DESASIGNAR' | null>(null);

    // Estado para guardar la posición original antes del drop
    const [posicionOriginal, setPosicionOriginal] = useState<string | null>(null);
    // Guardar el código del neumático que está siendo reubicado para controlar la posición original
    const [codigoOriginal, setCodigoOriginal] = useState<string | null>(null);

    // Estado para guardar info del swap
    const [swapInfo, setSwapInfo] = useState<null | { codigo: string; posicionOriginal: string; posicionNueva: string }>(null);

    // Estado para guardar el mapeo inicial de posición a neumático
    const [initialAssignedMap, setInitialAssignedMap] = useState<Record<string, any>>({});

    // Estado para guardar la última posición antes de desasignar
    const [ultimaPosicionDesasignada, setUltimaPosicionDesasignada] = useState<string | null>(null);

    // Snackbar personalizado para feedback visual
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success'|'error'|'info'|'warning'>('success');

    // Actualizar el estado local y el mapa inicial si cambian los props
    React.useEffect(() => {
        setNeumaticosAsignadosState(neumaticosAsignados);
        // Mapear posición => neumático (solo los que tienen posición)
        const map: Record<string, any> = {};
        neumaticosAsignados.forEach(n => {
            if (n.POSICION) map[n.POSICION] = n;
        });
        setInitialAssignedMap(map);
    }, [neumaticosAsignados]);

    // Cuando se selecciona un neumático, llenar el formulario
    const handleSeleccionarNeumatico = async (neumatico: any) => {
        setNeumaticoSeleccionado(neumatico);
        // Si selecciono un neumático diferente, limpiar la posición original
        if ((neumatico.CODIGO_NEU || neumatico.CODIGO) !== codigoOriginal) {
            setPosicionOriginal(null);
            setCodigoOriginal(null);
        }
        let ultimoKilometro = vehiculo?.kilometro?.toString() ?? '';
        let pr = '', carga = '', velocidad = '', fecha_fabricacion = '', rq = '', oc = '', remanente = '';
        let costo = '', proveedor = '', fecha_compra = '', presion_aire = '', torque_aplicado = '', estado = '';
        // Buscar el último movimiento por código
        try {
            const codigoBuscar = neumatico.CODIGO_NEU || neumatico.CODIGO;
            if (codigoBuscar) {
                const mov = await obtenerUltimosMovimientosPorCodigo(codigoBuscar);
                if (mov && mov.length > 0) {
                    const m = mov[0];
                    if (m.KILOMETRO !== undefined && m.KILOMETRO !== null) {
                        ultimoKilometro = m.KILOMETRO.toString();
                    }
                    pr = m.PR || '';
                    carga = m.CARGA || '';
                    velocidad = m.VELOCIDAD || '';
                    fecha_fabricacion = m.FECHA_FABRICACION || '';
                    rq = m.RQ || '';
                    oc = m.OC || '';
                    remanente = m.REMANENTE?.toString() || '';
                    costo = m.COSTO || '';
                    proveedor = m.PROVEEDOR || '';
                    fecha_compra = m.FECHA_COMPRA || '';
                    presion_aire = m.PRESION_AIRE?.toString() || '';
                    torque_aplicado = m.TORQUE_APLICADO?.toString() || '';
                    estado = m.ESTADO || '';
                }
            }
        } catch (e) {
            // Si hay error, usar el kilometro del vehículo
        }
        setFormValues({
            kilometro: ultimoKilometro,
            marca: neumatico.MARCA ?? '',
            modelo: neumatico.MODELO ?? '',
            codigo: neumatico.CODIGO_NEU ?? neumatico.CODIGO ?? '',
            posicion: neumatico.POSICION ?? '',
            medida: neumatico.MEDIDA ?? '',
            diseño: neumatico.DISEÑO ?? '',
            remanente: remanente,
            presion_aire: presion_aire,
            torque: torque_aplicado,
            tipo_movimiento: '',
            estado: estado,
            fecha_inspeccion: new Date().toISOString().slice(0, 16), // Fecha y hora actual
            observacion: '',
            accion: '', // <-- Limpiar acción al seleccionar
        });
        // Guardar los datos extra en el estado del neumático seleccionado
        setNeumaticoSeleccionado((prev: any) => ({
            ...prev,
            PR: pr,
            CARGA: carga,
            VELOCIDAD: velocidad,
            FECHA_FABRICACION: fecha_fabricacion,
            RQ: rq,
            OC: oc,
            COSTO: costo,
            PROVEEDOR: proveedor,
            FECHA_COMPRA: fecha_compra,
            PRESION_AIRE: presion_aire,
            TORQUE_APLICADO: torque_aplicado,
            ESTADO: estado,
            KILOMETRO: ultimoKilometro,
            REMANENTE: remanente,
        }));
        if (onSeleccionarNeumatico) onSeleccionarNeumatico(neumatico);
    };

    // Manejar cambios en los inputs
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    // Lógica para actualizar la posición del neumático al hacer drop
    const handleDropNeumatico = (neumatico: Neumatico, nuevaPosicion: string) => {
        const codigo = neumatico.CODIGO_NEU || neumatico.CODIGO;
        // Buscar si la posición destino está ocupada por otro neumático
        const neumaticoDestino = neumaticosAsignadosState.find(n => n.POSICION === nuevaPosicion);
        // Eliminar todos los duplicados de ese código (excepto el que se está moviendo y el swap)
        let nuevosNeumaticos = neumaticosAsignadosState.filter(n => (n.CODIGO_NEU || n.CODIGO) !== codigo);
        // Si hay swap, mantener el destino pero con la posición intercambiada
        if (nuevaPosicion && neumaticoDestino && (neumaticoDestino.CODIGO_NEU !== neumatico.CODIGO_NEU && neumaticoDestino.CODIGO !== neumatico.CODIGO)) {
            nuevosNeumaticos.push({ ...neumatico, POSICION: nuevaPosicion });
            nuevosNeumaticos.push({ ...neumaticoDestino, POSICION: neumatico.POSICION });
            setNeumaticosAsignadosState(nuevosNeumaticos);
            handleSeleccionarNeumatico({ ...neumatico, POSICION: nuevaPosicion });
            setPosicionOriginal(neumatico.POSICION || null);
            setCodigoOriginal(codigo || null);
            setSwapInfo({
                codigo: neumaticoDestino.CODIGO_NEU || neumaticoDestino.CODIGO || '',
                posicionOriginal: neumaticoDestino.POSICION,
                posicionNueva: neumatico.POSICION,
            });
            return;
        }
        // Si no hay swap, lógica normal
        const yaOcupada = neumaticosAsignadosState.some(n => n.POSICION === nuevaPosicion && (n.CODIGO_NEU !== neumatico.CODIGO_NEU && n.CODIGO !== neumatico.CODIGO));
        if (nuevaPosicion && yaOcupada) return;
        if (typeof neumatico.POSICION === 'string' && neumatico.POSICION !== nuevaPosicion) {
            setPosicionOriginal(neumatico.POSICION);
            setCodigoOriginal(codigo || null);
        } else if (!nuevaPosicion) {
            setPosicionOriginal(null);
            setCodigoOriginal(null);
        }
        // Guardar la última posición antes de desasignar
        if (!nuevaPosicion && neumatico.POSICION) {
            setUltimaPosicionDesasignada(neumatico.POSICION);
        }
        // Si el neumático está siendo desasignado y su TIPO_MOVIMIENTO es BAJA DEFINITIVA o RECUPERADO, no lo agregues a la lista local de asignados
        if (!nuevaPosicion && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO')) {
            // No lo agregues a nuevosNeumaticos
        } else if (nuevaPosicion) {
            nuevosNeumaticos.push({ ...neumatico, POSICION: nuevaPosicion });
        } else {
            nuevosNeumaticos.push({ ...neumatico, POSICION: '' });
        }
        setNeumaticosAsignadosState(nuevosNeumaticos);
        handleSeleccionarNeumatico({ ...neumatico, POSICION: nuevaPosicion });
        setSwapInfo(null);
    };

    // Limpiar selección al hacer click en una posición vacía
    const handlePosicionClick = (neumatico: Neumatico | undefined) => {
        if (!neumatico) {
            setNeumaticoSeleccionado(null);
            setFormValues({
                kilometro: '',
                marca: '',
                modelo: '',
                codigo: '',
                posicion: '',
                medida: '',
                diseño: '',
                remanente: '',
                presion_aire: '',
                torque: '',
                tipo_movimiento: '',
                estado: '',
                observacion: '',
                fecha_inspeccion: '',
                accion: '', // <-- Limpiar acción
            });
        } else {
            handleSeleccionarNeumatico(neumatico);
        }
    };

    // Manejar el drop de neumático en una posición
    const handleDragEnd = (event: any) => {
        const { over, active } = event;
        if (over && active) {
            if (over.id === 'neumaticos-por-rotar') {
                // Drop en el card: desasignar
                const neu = neumaticosAsignadosState.find((n) => (n.CODIGO_NEU || n.CODIGO || n.POSICION) === active.id);
                if (neu && neu.POSICION) {
                    handleDropNeumatico(neu, '');
                }
            } else if (typeof over.id === 'string' && over.id.startsWith('POS')) {
                // Drop en una posición del diagrama
                const neu = neumaticosAsignadosState.find((n) => (n.CODIGO_NEU || n.CODIGO || n.POSICION) === active.id);
                if (neu && over.id) {
                    handleDropNeumatico(neu, over.id);
                }
            }
        }
    };

    // Obtener datos extra del último movimiento para ambos neumáticos
    const getFullData = async (neu: any) => {
        let result = { ...neu };
        try {
            const codigoBuscar = neu.CODIGO_NEU || neu.CODIGO;
            if (codigoBuscar) {
                const mov = await obtenerUltimosMovimientosPorCodigo(codigoBuscar);
                if (mov && mov.length > 0) {
                    const m = mov[0];
                    result = {
                        ...result,
                        PR: m.PR || '',
                        CARGA: m.CARGA || '',
                        VELOCIDAD: m.VELOCIDAD || '',
                        FECHA_FABRICACION: m.FECHA_FABRICACION || '',
                        RQ: m.RQ || '',
                        OC: m.OC || '',
                        COSTO: m.COSTO || '',
                        PROVEEDOR: m.PROVEEDOR || '',
                        FECHA_COMPRA: m.FECHA_COMPRA || '',
                        PRESION_AIRE: m.PRESION_AIRE?.toString() || '',
                        TORQUE_APLICADO: m.TORQUE_APLICADO?.toString() || '',
                        ESTADO: m.ESTADO || '',
                        KILOMETRO: m.KILOMETRO?.toString() || '',
                        REMANENTE: m.REMANENTE?.toString() || '',
                    };
                }
            }
        } catch (e) { /* ignorar error, usar lo que haya */ }
        return result;
    };

    // Handler para guardar reubicación
    const handleGuardarReubicacion = async () => {
        // 1. Detectar todos los swaps comparando estado inicial y final
        const movimientos: any[] = [];
        const posiciones = Object.keys(initialAssignedMap);
        for (const pos of posiciones) {
            const neuInicial = initialAssignedMap[pos];
            // Ignorar completamente los neumáticos de baja definitiva o recuperado
            if (neuInicial && (neuInicial.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neuInicial.TIPO_MOVIMIENTO === 'RECUPERADO')) {
                continue;
            }
            const neuFinal = neumaticosAsignadosState.find(n => n.POSICION === pos && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');
            // Si hay neumático en la posición final y cambió respecto al inicial (o antes no había)
            if (neuFinal && (!neuInicial || (neuFinal.CODIGO_NEU || neuFinal.CODIGO) !== (neuInicial.CODIGO_NEU || neuInicial.CODIGO))) {
                // Buscar la posición anterior de este neumático
                let posAnterior = '';
                for (const p2 of posiciones) {
                    const n2 = initialAssignedMap[p2];
                    if (n2 && (n2.CODIGO_NEU || n2.CODIGO) === (neuFinal.CODIGO_NEU || neuFinal.CODIGO)) {
                        posAnterior = p2;
                        break;
                    }
                }
                // Si no estaba en ninguna posición antes, es nuevo (no swap)
                // Si sí estaba, es swap
                const fullNeu = await getFullData({
                    ...neuFinal,
                    MARCA: neuFinal.MARCA,
                    MEDIDA: neuFinal.MEDIDA,
                    DISEÑO: neuFinal.DISEÑO,
                    REMANENTE: neuFinal.REMANENTE,
                    PLACA: placa,
                });
                let posicionNeuOriginal = posAnterior;
                // Obtener la fecha de asignación original desde initialAssignedMap usando el código del neumático
                const codigoNeu = fullNeu.CODIGO_NEU || fullNeu.CODIGO;
                let fechaAsignacionOriginal = '';
                // Buscar en el mapa inicial por código
                for (const key of Object.keys(initialAssignedMap)) {
                    const n = initialAssignedMap[key];
                    if (n && (n.CODIGO_NEU || n.CODIGO) === codigoNeu) {
                        fechaAsignacionOriginal = n.FECHA_ASIGNACION || n.FECHA_REGISTRO || '';
                        break;
                    }
                }
                movimientos.push({
                    CODIGO: fullNeu.CODIGO_NEU || fullNeu.CODIGO,
                    MARCA: fullNeu.MARCA,
                    MEDIDA: fullNeu.MEDIDA,
                    DISEÑO: fullNeu.DISEÑO,
                    REMANENTE: fullNeu.REMANENTE,
                    PR: fullNeu.PR,
                    CARGA: fullNeu.CARGA,
                    VELOCIDAD: fullNeu.VELOCIDAD,
                    FECHA_FABRICACION: fullNeu.FECHA_FABRICACION,
                    RQ: fullNeu.RQ,
                    OC: fullNeu.OC,
                    PROYECTO: vehiculo?.proyecto || '',
                    COSTO: fullNeu.COSTO,
                    PROVEEDOR: fullNeu.PROVEEDOR,
                    FECHA_REGISTRO: formValues.fecha_inspeccion || new Date().toISOString(),
                    FECHA_COMPRA: fullNeu.FECHA_COMPRA,
                    USUARIO_SUPER: user?.usuario || user?.email || user?.nombre || '',
                    PRESION_AIRE: fullNeu.PRESION_AIRE,
                    TORQUE_APLICADO: fullNeu.TORQUE_APLICADO,
                    ESTADO: fullNeu.ESTADO,
                    PLACA: placa,
                    POSICION_NEU: posicionNeuOriginal, // POSICION_NEU = POSICION_INICIAL
                    POSICION_INICIAL: posicionNeuOriginal,
                    POSICION_FIN: pos, // POSICION_FIN = nueva posición
                    DESTINO: vehiculo?.proyecto || '',
                    FECHA_ASIGNACION: fechaAsignacionOriginal,
                    KILOMETRO: fullNeu.KILOMETRO,
                    FECHA_MOVIMIENTO: getLocalDateTimeStringForPayload(),
                    OBSERVACION: formValues.observacion,
                });
            }
        }
        if (movimientos.length === 0) {
            setSnackbarMsg('No hay cambios de posición para registrar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        // Normalizar el array antes de enviar
        const normalizedPayloadArray = movimientos.map(normalizePayload);
        // LOG para depuración: ver el payload antes de enviarlo
        console.log('Payload que se enviará al backend (reubicación):', normalizedPayloadArray);
        // Puedes dejar este log o quitarlo luego de validar
        try {
            await registrarReubicacionNeumatico(normalizedPayloadArray);
            setSnackbarMsg('Reubicación registrada correctamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setPosicionOriginal(null);
            setCodigoOriginal(null);
            setSwapInfo(null);
            // onClose(); // <--- Eliminar el cierre inmediato
        } catch (error) {
            if (error instanceof Error) {
                setSnackbarMsg('Error al registrar la reubicación: ' + error.message);
            } else {
                setSnackbarMsg('Error al registrar la reubicación: ' + String(error));
            }
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Handler para guardar desasignación
    const handleGuardarDesasignacion = async () => {
        if (!neumaticoSeleccionado) {
            setSnackbarMsg('Selecciona un neumático para desasignar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        if (!formValues.accion) {
            setSnackbarMsg('Selecciona una acción para la desasignación.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        // Construir el payload
        // Usar la última posición conocida si la actual está vacía y solo si es válida (POS01, POS02, etc.)
        let posicionParaPayload = neumaticoSeleccionado.POSICION || ultimaPosicionDesasignada || posicionOriginal || '';
        // Validar que la posición sea válida (ejemplo: POS01, POS02, POS03, POS04)
        if (!/^POS\d{2}$/.test(posicionParaPayload)) {
            // Si no es válida, intenta buscar la posición original en el mapeo inicial
            const codigo = neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO;
            const posValida = Object.keys(initialAssignedMap).find(
                key => (initialAssignedMap[key]?.CODIGO_NEU || initialAssignedMap[key]?.CODIGO) === codigo
            );
            if (posValida) {
                posicionParaPayload = posValida;
            } else {
                posicionParaPayload = '';
            }
        }
        const payload = {
            CODIGO: neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO,
            MARCA: neumaticoSeleccionado.MARCA,
            MEDIDA: neumaticoSeleccionado.MEDIDA,
            DISEÑO: neumaticoSeleccionado.DISEÑO,
            REMANENTE: neumaticoSeleccionado.REMANENTE,
            PR: neumaticoSeleccionado.PR,
            CARGA: neumaticoSeleccionado.CARGA,
            VELOCIDAD: neumaticoSeleccionado.VELOCIDAD,
            FECHA_FABRICACION: neumaticoSeleccionado.FECHA_FABRICACION,
            RQ: neumaticoSeleccionado.RQ,
            OC: neumaticoSeleccionado.OC,
            PROYECTO: vehiculo?.proyecto || '',
            COSTO: neumaticoSeleccionado.COSTO,
            PROVEEDOR: neumaticoSeleccionado.PROVEEDOR,
            FECHA_REGISTRO: formValues.fecha_inspeccion || new Date().toISOString().slice(0, 10),
            FECHA_COMPRA: neumaticoSeleccionado.FECHA_COMPRA,
            USUARIO_SUPER: user?.usuario || user?.email || user?.nombre || '',
            TIPO_MOVIMIENTO: formValues.accion, // <-- Usar formValues.accion
            PRESION_AIRE: neumaticoSeleccionado.PRESION_AIRE,
            TORQUE_APLICADO: neumaticoSeleccionado.TORQUE_APLICADO,
            ESTADO: neumaticoSeleccionado.ESTADO,
            PLACA: placa,
            POSICION_NEU: posicionParaPayload,
            DESTINO: vehiculo?.proyecto || '',
            FECHA_ASIGNACION: formValues.fecha_inspeccion || new Date().toISOString().slice(0, 10),
            KILOMETRO: neumaticoSeleccionado.KILOMETRO,
            FECHA_MOVIMIENTO: formValues.fecha_inspeccion ? getLocalDateTimeStringForPayload() : getLocalDateTimeStringForPayload(),
            OBSERVACION: formValues.observacion,
        };
        // LOG para depuración: ver el payload antes de enviarlo
        console.log('Payload que se enviará al backend (desasignación):', payload);
        try {
            await registrarDesasignacionNeumatico(payload);
            setSnackbarMsg('Desasignación registrada correctamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            onClose();
        } catch (error) {
            setSnackbarMsg('Error al registrar la desasignación: ' + (error instanceof Error ? error.message : String(error)));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Filtro robusto para la dropzone: solo el último movimiento por código y sin BAJA DEFINITIVA/RECUPERADO
    const neumaticosSinPosicionFiltrados = React.useMemo(() => {
        // 1. Solo los que no tienen posición
        const sinPos = neumaticosAsignadosState.filter(n => (!n.POSICION || n.POSICION === '') && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');
        // 2. Solo el último movimiento por código
        const porCodigo = Object.values(
            sinPos.reduce((acc: Record<string, Neumatico>, curr) => {
                const cod = curr.CODIGO_NEU || curr.CODIGO;
                if (!cod) return acc;
                if (!acc[cod] || ((curr.ID_MOVIMIENTO ?? 0) > (acc[cod].ID_MOVIMIENTO ?? 0))) {
                    acc[cod] = curr;
                }
                return acc;
            }, {})
        );
        // 3. Excluir BAJA DEFINITIVA y RECUPERADO (ya filtrado arriba, pero por seguridad)
        return porCodigo.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');
    }, [neumaticosAsignadosState]);

    // Utilidad para obtener fecha/hora local en formato YYYY-MM-DDTHH:mm
    function getLocalDateTimeString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Utilidad para obtener fecha/hora local en formato YYYY-MM-DD HH:mm:ss
    function getLocalDateTimeStringForPayload() {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    // Utilidad para obtener fecha local en formato YYYY-MM-DD
    function getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={(_event, reason) => {
                    setSnackbarOpen(false);
                    if (snackbarSeverity === 'success' && snackbarMsg === 'Reubicación registrada correctamente') {
                        onClose();
                    }
                }}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MuiAlert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    elevation={6}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarSeverity === 'success' && (
                        <AlertTitle>Éxito</AlertTitle>
                    )}
                    {snackbarSeverity === 'error' && (
                        <AlertTitle>Error</AlertTitle>
                    )}
                    {snackbarSeverity === 'info' && (
                        <AlertTitle>Información</AlertTitle>
                    )}
                    {snackbarSeverity === 'warning' && (
                        <AlertTitle>Advertencia</AlertTitle>
                    )}
                    {snackbarMsg}
                </MuiAlert>
            </Snackbar>
            <DialogContent>
                <DndContext onDragEnd={handleDragEnd}>
                    <Stack direction="row" spacing={2}>
                        <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        Mantenimiento de Neumáticos
                                    </Typography>
                                    {vehiculo ? (
                                        <Stack direction="row" spacing={4} alignItems="flex-start" sx={{ mb: 1 }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Marca
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {vehiculo.marca}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Modelo
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {vehiculo.modelo}
                                                </Typography>
                                            </Box>
                                            {vehiculo?.proyecto && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Proyecto
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.proyecto}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {vehiculo?.operacion && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Operación
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.operacion}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Año
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {vehiculo.anio}
                                                </Typography>
                                            </Box>
                                            {vehiculo?.color && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Color
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.color}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {vehiculo?.kilometro !== undefined && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Kilometraje
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.kilometro.toLocaleString()} km
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No hay datos del vehículo.
                                        </Typography>
                                    )}
                                </Box>
                            </Card>
                            {/* Mostrar solo el card correspondiente según la acción */}
                            {accion === 'REUBICADO' && (
                                <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                                        <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>
                                            REUBICAR
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <TextField
                                            label="Fecha"
                                            name="fecha_reubicacion"
                                            size="small"
                                            type="date"
                                            value={formValues.fecha_inspeccion?.slice(0, 10) || getLocalDateTimeString().slice(0, 10)}
                                            onChange={(e) => setFormValues((prev) => ({ ...prev, fecha_inspeccion: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ max: getLocalDateTimeString().slice(0, 10) }}
                                            sx={{ minWidth: 220, mb: 0 }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
                                        <TextField
                                            label="motivo"
                                            name="observacion"
                                            size="small"
                                            multiline
                                            minRows={2}
                                            value={formValues.observacion}
                                            onChange={handleInputChange}
                                            sx={{ minWidth: 220, flex: 1 }}
                                        />
                                        <DropNeumaticosPorRotar onDropNeumatico={(neu) => handleDropNeumatico(neu, '')}>
                                            <Box
                                                sx={{
                                                    mt: 0,
                                                    display: 'flex',
                                                    justifyContent: 'flex-start',
                                                    alignItems: 'flex-end',
                                                    minHeight: 100,
                                                    width: '300px',
                                                    maxWidth: '100%',
                                                    mx: 0,
                                                    p: 1,
                                                    overflowX: 'auto',
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="flex-end">
                                                    {neumaticosSinPosicionFiltrados.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO').map((neu, idx) => (
                                                        <Box
                                                            key={`${neu.CODIGO_NEU || neu.CODIGO || neu.POSICION}-${idx}`}
                                                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}
                                                        >
                                                            <DraggableNeumatico neumatico={neu} />
                                                            <NeumaticoInfo neumatico={neu} />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </DropNeumaticosPorRotar>
                                    </Box>
                                    <Button onClick={onClose} color="primary" variant="contained">
                                        Cerrar
                                    </Button>
                                    <Button color="success" variant="contained" sx={{ ml: 1 }} onClick={handleGuardarReubicacion}>
                                        Guardar Reubicación
                                    </Button>
                                </Card>
                            )}
                            {accion === 'DESASIGNAR' && (
                                <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                                        <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>
                                            DESASIGNAR
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <TextField
                                            label="Fecha"
                                            name="fecha_desasignacion"
                                            size="small"
                                            type="date"
                                            value={formValues.fecha_inspeccion?.slice(0, 10) || getLocalDateString()}
                                            onChange={(e) => setFormValues((prev) => ({ ...prev, fecha_inspeccion: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ max: getLocalDateString() }}
                                            sx={{ minWidth: 220, mb: 0 }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 220, flex: 1 }}>
                                            <TextField
                                                select
                                                label="Acción"
                                                name="accion"
                                                size="small"
                                                value={formValues.accion}
                                                onChange={handleInputChange}
                                                inputProps={{ style: { minWidth: '180px' } }}
                                                sx={{ minWidth: 220 }}
                                            >
                                                <MenuItem value="RECUPERADO">RECUPERADO</MenuItem>
                                                <MenuItem value="BAJA DEFINITIVA">BAJA DEFINITIVA</MenuItem>
                                            </TextField>
                                            <TextField
                                                label="Observación"
                                                name="observacion"
                                                size="small"
                                                multiline
                                                minRows={2}
                                                value={formValues.observacion}
                                                onChange={handleInputChange}
                                                sx={{ minWidth: 220, width: '100%' }}
                                            />
                                        </Box>
                                        <DropNeumaticosPorRotar onDropNeumatico={(neu) => handleDropNeumatico(neu, '')}>
                                            <Box
                                                sx={{
                                                    mt: 0,
                                                    display: 'flex',
                                                    justifyContent: 'flex-start',
                                                    alignItems: 'flex-end',
                                                    minHeight: 100,
                                                    width: '300px',
                                                    maxWidth: '100%',
                                                    mx: 0,
                                                    p: 1,
                                                    overflowX: 'auto',
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="flex-end">
                                                    {neumaticosSinPosicionFiltrados.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO').map((neu, idx) => (
                                                        <Box
                                                            key={`${neu.CODIGO_NEU || neu.CODIGO || neu.POSICION}-${idx}`}
                                                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}
                                                        >
                                                            <DraggableNeumatico neumatico={neu} />
                                                            <NeumaticoInfo neumatico={neu} />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </DropNeumaticosPorRotar>
                                    </Box>
                                    <Button onClick={onClose} color="primary" variant="contained">
                                        Cerrar
                                    </Button>
                                    <Button color="success" variant="contained" sx={{ ml: 1 }} onClick={handleGuardarDesasignacion}>
                                        Guardar Desasignación
                                    </Button>
                                </Card>
                            )}
                        </Stack>
                        {/* Columna derecha: Imagen o visualización */}
                        <Card
                            sx={{
                                flex: 0.5,
                                p: 2,
                                position: 'relative',
                                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                                maxWidth: 400,
                                minWidth: 320,
                                width: '100%',
                            }}
                        >
                            <Box sx={{ position: 'relative', width: '370px', height: '430px' }}>
                                <DiagramaVehiculo
                                    neumaticosAsignados={neumaticosAsignadosState.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO')}
                                    layout="modal"
                                    onPosicionClick={handlePosicionClick}
                                    onRotarClick={() => setAccion('REUBICADO')}
                                    onDesasignarClick={() => setAccion('DESASIGNAR')}
                                    fromMantenimientoModal={true}
                                    placa={placa}
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
                </DndContext>
            </DialogContent>
        </Dialog>
    );
};

// Componente para un neumático draggable
export type DraggableNeumaticoProps = { neumatico: Neumatico };
export const DraggableNeumatico: React.FC<DraggableNeumaticoProps> = ({ neumatico }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION,
    });
    const style = {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 62,
        borderRadius: '11px',
        background: '#fff',
        border: isDragging ? '2px solid #388e3c' : '2px solid #bdbdbd',
        boxShadow: isDragging ? '0 0 12px #388e3c' : '0 5px 7px #bbb',
        margin: '0 auto 12px auto',
        cursor: 'grab',
        opacity: isDragging ? 0.7 : 1,
        transition: 'box-shadow 0.2s, border 0.2s, opacity 0.2s',
        position: 'relative' as const,
    };
    return (
        <div
            ref={setNodeRef}
            style={{ ...style, transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
            {...listeners}
            {...attributes}
        >
            <img
                src={'/assets/neumatico.png'}
                alt="Neumático"
                style={{ width: 28, height: 77, objectFit: 'contain', filter: isDragging ? 'brightness(0.8)' : undefined }}
            />
        </div>
    );
};

// Extraemos la info del neumático a un componente aparte
const NeumaticoInfo: React.FC<{ neumatico: Neumatico }> = ({ neumatico }) => (
    <>
        <Typography variant="caption" fontWeight="bold" sx={{ mt: 0.5, fontSize: 11, textAlign: 'center', width: '100%' }}>
            {neumatico.CODIGO_NEU || neumatico.CODIGO || 'Sin código'}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10, color: '#888', textAlign: 'center', width: '100%' }}>
            {neumatico.MARCA || ''}
        </Typography>
    </>
);

// Drop target para el card de Neumáticos por Rotar
export const DropNeumaticosPorRotar: React.FC<{
    onDropNeumatico: (neumatico: Neumatico) => void;
    children: React.ReactNode;
}> = ({ onDropNeumatico, children }) => {
    const { setNodeRef, isOver, active } = useDroppable({ id: 'neumaticos-por-rotar' });
    React.useEffect(() => {
        if (isOver && active && active.data?.current) {
            const neu = active.data.current as Neumatico;
            if (neu && typeof neu.POSICION === 'string' && neu.POSICION) {
                onDropNeumatico({ ...neu, POSICION: '' });
            }
        }
        // eslint-disable-next-line
    }, [isOver]);
    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 120,
                width: '300px',
                maxWidth: '100%', // No se sale del card
                background: isOver ? '#e0f7fa' : '#fafafa',
                border: isOver ? '2px solid #388e3c' : '1px solid #bdbdbd',
                borderRadius: 2,
                p: 1,
                transition: 'background 0.2s, border 0.2s',
                overflowX: 'auto',
            }}
        >
            {children}
        </Box>
    );
};

export default ModalInpeccionNeu;
function normalizePayload(mov: any) {
    // Normaliza los campos y asegura que todos estén presentes y en el formato correcto
    return {
        CODIGO: mov.CODIGO || '',
        MARCA: mov.MARCA || '',
        MEDIDA: mov.MEDIDA || '',
        DISEÑO: mov.DISEÑO || '',
        REMANENTE: mov.REMANENTE || '',
        PR: mov.PR || '',
        CARGA: mov.CARGA || '',
        VELOCIDAD: mov.VELOCIDAD || '',
        FECHA_FABRICACION: mov.FECHA_FABRICACION || '',
        RQ: mov.RQ || '',
        OC: mov.OC || '',
        PROYECTO: mov.PROYECTO || '',
        COSTO: mov.COSTO || '',
        PROVEEDOR: mov.PROVEEDOR || '',
        FECHA_REGISTRO: mov.FECHA_REGISTRO ? new Date(mov.FECHA_REGISTRO).toISOString() : new Date().toISOString(),
        FECHA_COMPRA: mov.FECHA_COMPRA || '',
        USUARIO_SUPER: mov.USUARIO_SUPER || '',
        PRESION_AIRE: mov.PRESION_AIRE || '',
        TORQUE_APLICADO: mov.TORQUE_APLICADO || '',
        ESTADO: mov.ESTADO || '',
        PLACA: mov.PLACA || '',
        POSICION_NEU: mov.POSICION_NEU || '',
        POSICION_INICIAL: mov.POSICION_INICIAL || '',
        POSICION_FIN: mov.POSICION_FIN || '',
        DESTINO: mov.DESTINO || '',
        FECHA_ASIGNACION: mov.FECHA_ASIGNACION || '',
        KILOMETRO: mov.KILOMETRO || '',
        FECHA_MOVIMIENTO: mov.FECHA_MOVIMIENTO || '',
        OBSERVACION: mov.OBSERVACION || mov.OBS || mov.observacion || '',
    };
}

