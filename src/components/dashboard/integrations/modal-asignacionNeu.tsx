import React, { forwardRef, useState, useMemo, useEffect } from 'react';
import {
    Box,
    Card,
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    useTheme,
} from '@mui/material';
import Button from '@mui/material/Button';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ModalAvertAsigNeu from './modal-avertAsigNeu';
import ModalInputsNeu from './modal-inputsNeu';
import { Neumatico } from '@/types/types';
import { asignarNeumatico } from '../../../api/Neumaticos'; // Ajusta la ruta según la ubicación real del archivo
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';

const ItemType = {
    NEUMATICO: 'neumatico',
};


export interface ModalAsignacionNeuProps {
    open: boolean;
    onClose: () => void;
    data: Neumatico[];
    assignedNeumaticos: Neumatico[]; // Added this property
    placa: string;
    kilometro: number;
    onAssignedUpdate?: () => void; // Nuevo callback para refrescar asignados
}

const DraggableNeumatico: React.FC<{
    neumatico: Neumatico;
    disabled?: boolean;
}> = React.memo(({ neumatico, disabled = false }) => {
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: ItemType.NEUMATICO,
            item: { ...neumatico },
            canDrag: !disabled,
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        }),
        [neumatico, disabled]
    );

    const ref = React.useRef<HTMLDivElement>(null);
    drag(ref);

    return (
        <div
            ref={ref}
            style={{
                cursor: disabled ? 'not-allowed' : 'grab',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <img
                src="/assets/neumatico.png"
                alt="Neumático"
                style={{
                    width: '30px',
                    height: '60px',
                    display: 'block',
                    margin: '0 auto',
                    objectFit: 'contain',
                }}
            />
        </div>
    );
});


const isDuplicadoEnOtraPos = (
    codigo: string,
    posicionActual: string,
    asignaciones: { [key: string]: Neumatico | null }
): boolean => {
    return Object.entries(asignaciones).some(
        ([posicion, neumatico]) =>
            neumatico?.CODIGO === codigo && posicion !== posicionActual
    );
};

interface DropZoneProps {
    position: string;
    onDrop: (neumatico: Neumatico) => void;
    isAssigned: boolean;
    assignedNeumaticos: Record<string, Neumatico | null>;
    setAssignedNeumaticos: React.Dispatch<React.SetStateAction<Record<string, Neumatico | null>>>;
    kilometro: number; // <-- Agregado
}

// Elimina la interfaz ModalInputsNeuData, ya que no es compatible con el componente ModalInputsNeu

const DropZone: React.FC<DropZoneProps> = ({
    position,
    onDrop,
    isAssigned,
    assignedNeumaticos,
    setAssignedNeumaticos,
    kilometro, // <-- Agregado
}) => {
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
    const [dropBlocked, setDropBlocked] = React.useState<boolean>(false);
    const [lastRemovedCode, setLastRemovedCode] = React.useState<string | null>(null);
    const [isShaking, setIsShaking] = React.useState<boolean>(false);
    const [inputsModalOpen, setInputsModalOpen] = React.useState<boolean>(false);
    const [pendingInputs, setPendingInputs] = React.useState<null | { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }>(null);

    const triggerShake = (): void => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600); // Dura 600ms
    };

    const handleInputsModalSubmit = (data: { Odometro: number; Remanente: number; PresionAire: number; TorqueAplicado: number; FechaAsignacion: string }): void => {
        // Guarda los datos en el neumático asignado a esta posición
        setAssignedNeumaticos((prev) => {
            const current = prev[position];
            if (!current) return prev;
            return {
                ...prev,
                [position]: {
                    ...current,
                    REMANENTE: data.Remanente,
                    PRESION_AIRE: data.PresionAire,
                    TORQUE_APLICADO: data.TorqueAplicado,
                    ODOMETRO: data.Odometro,
                    FECHA_ASIGNACION: data.FechaAsignacion,
                },
            };
        });
        setInputsModalOpen(false);
    };
    // Hook y ref para drop de react-dnd
    const ref = React.useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
        accept: ItemType.NEUMATICO,
        drop: (item: Neumatico) => {
            if (isModalOpen || dropBlocked) return;
            if (item.CODIGO === lastRemovedCode) {
                console.log('Drop ignorado: mismo código que el eliminado recientemente.');
                return;
            }
            let shouldShake = false;
            setAssignedNeumaticos((prev) => {
                if (isDuplicadoEnOtraPos(item.CODIGO, position, prev)) {
                    shouldShake = true;
                    return prev;
                }
                return { ...prev, [position]: item };
            });
            if (shouldShake) {
                setTimeout(() => { triggerShake(); }, 0);
            } else {
                setInputsModalOpen(true);
            }
            if (shouldShake) {
                setTimeout(() => { triggerShake(); }, 0);
            }
        },
    });
    drop(ref);

    const handleContextMenu = (event: React.MouseEvent): void => {
        event.preventDefault();
        if (isAssigned) {
            setMenuAnchor(event.currentTarget as HTMLElement);
        }
    };

    const handleCloseMenu = (): void => {
        setMenuAnchor(null);
    };

    const handleOpenModal = (): void => {
        setIsModalOpen(true);
        handleCloseMenu();
    };

    const handleCloseModal = (): void => {
        setIsModalOpen(false);
    };

    const handleConfirmRemove = (): void => {
        const removedCode = assignedNeumaticos[position]?.CODIGO || null;
        setIsModalOpen(false);
        setDropBlocked(true);
        setLastRemovedCode(removedCode);

        setTimeout(() => {
            setAssignedNeumaticos((prev) => ({
                ...prev,
                [position]: null,
            }));

            setTimeout(() => {
                setDropBlocked(false);
                setLastRemovedCode(null);
            }, 200);
        }, 0);
    };

    // Determinar si el neumático de la posición está en baja definitiva o recuperado
    const neumatico = assignedNeumaticos[position];
    const esBajaORecuperado = neumatico && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO');

    return (
        <div
            ref={ref}
            onContextMenu={handleContextMenu}
            style={{
                width: '45px',
                height: '97px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isAssigned && !esBajaORecuperado ? 'lightgreen' : 'transparent',
                borderRadius: '20px',
                border: 'none',
                pointerEvents: 'all',
                cursor: isAssigned && !esBajaORecuperado ? 'pointer' : 'default',
                boxShadow: isShaking ? '0 0 10px 4px red' : 'none',
                transition: 'box-shadow 0.2s ease-in-out',
            }}
        >
            {/* Solo mostrar el neumático si no es baja ni recuperado */}
            {isAssigned && !esBajaORecuperado ? (
                <span>
                    {assignedNeumaticos[position]?.CODIGO || '🛞'}
                </span>
            ) : null}
            {/* Si no está asignado o es baja/recuperado, no mostrar nada visual extra */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
                <MenuItem onClick={() => { setInputsModalOpen(true); handleCloseMenu(); }}>Editar neumático</MenuItem>
                <MenuItem onClick={handleOpenModal}>Quitar neumático</MenuItem>
            </Menu>

            <ModalAvertAsigNeu
                open={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmRemove}
                message={`¿Deseas quitar el neumático asignado en la posición ${position}?`}
            />
            <ModalInputsNeu
                open={inputsModalOpen}
                onClose={() => setInputsModalOpen(false)}
                onSubmit={handleInputsModalSubmit}
                initialRemanente={assignedNeumaticos[position]?.REMANENTE ? Number(assignedNeumaticos[position]?.REMANENTE) : 0}
                initialOdometro={typeof kilometro === 'number' ? kilometro : 0}
                initialPresionAire={assignedNeumaticos[position]?.PRESION_AIRE ? Number(assignedNeumaticos[position]?.PRESION_AIRE) : 0}
                initialTorqueAplicado={assignedNeumaticos[position]?.TORQUE_APLICADO ? Number(assignedNeumaticos[position]?.TORQUE_APLICADO) : 0}
            />
        </div>
    );
};




const ModalAsignacionNeu: React.FC<ModalAsignacionNeuProps> = ({ open, onClose, data, assignedNeumaticos: initialAssignedNeumaticos, placa, kilometro, onAssignedUpdate }) => {
    //console.log('ModalAsignacionNeu props:', { open, onClose, data, initialAssignedNeumaticos, placa, kilometro, onAssignedUpdate });
    const initialAssignedMap = useMemo<Record<string, Neumatico | null>>(
        () => {
            // Arranco con las cuatro posiciones en null
            const mapa: Record<string, Neumatico | null> = {
                POS01: null,
                POS02: null,
                POS03: null,
                POS04: null,
            };
            initialAssignedNeumaticos.forEach((neu) => {
                const pos = neu.POSICION_NEU;
                if (pos && mapa.hasOwnProperty(pos)) {
                    mapa[pos] = neu;
                }
            });
            return mapa;
        },
        [initialAssignedNeumaticos]
    );


    const [assignedNeumaticos, setAssignedNeumaticos] = useState(initialAssignedMap);

    // Debe estar aquí, en el scope principal del componente
    const allPositionsAssigned = Object.values(assignedNeumaticos).filter(Boolean).length === 4;

    // Snackbar personalizado para feedback visual
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');



    const theme = useTheme();

    // ——————————————————————————————————————
    // 𝐂𝐨𝐝𝐢𝐠𝐨𝐬 𝐝𝐞 𝐥𝐨𝐬 𝐧𝐞𝐮𝐦𝐚𝐭𝐢𝐜𝐨𝐬 𝐪𝐮𝐞 𝐩𝐨𝐬𝐭𝐞𝐫𝐢𝐨𝐫𝐦𝐞𝐧𝐭𝐞 𝐞𝐬𝐭𝐚𝐧 𝐚𝐬𝐢𝐠𝐧𝐚𝐝𝐨𝐬
    const assignedCodes = useMemo(
        () =>
            new Set(
                Object.values(assignedNeumaticos)
                    .filter((n): n is Neumatico => n !== null)
                    .map((n) => n.CODIGO ?? (n as any).CODIGO_NEU)
            ),
        [assignedNeumaticos]
    );



    useEffect(() => {
        if (open) {
            setAssignedNeumaticos(initialAssignedMap);
        }
        // LOG extra para ver qué props llegan desde el padre
        console.log('PROPS assignedNeumaticos (initialAssignedNeumaticos):', initialAssignedNeumaticos);
        console.log('initialAssignedMap:', initialAssignedMap);
    }, [open, initialAssignedMap, initialAssignedNeumaticos]);

    useEffect(() => {
        // LOG para ver el estado local del modal
        console.log('Assigned Neumaticos (estado local):', assignedNeumaticos);
    }, [assignedNeumaticos]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(3);
    const [searchTerm, setSearchTerm] = useState('');

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleDialogClose = () => {
        onClose(); // Llama la función original
        setTimeout(() => {
            document.body.focus(); // Previene el warning
        }, 0);
    };


    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDrop = (position: string, neumatico: Neumatico) => {
        const isDuplicate = Object.entries(assignedNeumaticos).some(
            ([key, assigned]) => assigned?.CODIGO === neumatico.CODIGO && key !== position
        );

        if (isDuplicate) {
            alert(`El neumático con código ${neumatico.CODIGO} ya está asignado a otra posición.`);
            return;
        }

        setAssignedNeumaticos((prev) => ({
            ...prev,
            [position]: neumatico,
        }));
    };



    const hasAssignedNeumaticos = Object.values(assignedNeumaticos).some((neumatico) => neumatico !== null);

    const filteredData = useMemo(() => {
        return data.filter(
            (neumatico) =>
                neumatico.TIPO_MOVIMIENTO === 'DISPONIBLE' &&
                (neumatico.CODIGO.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    neumatico.MARCA.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);


    // ------------------------------------------------
    // Ahora asigna SIEMPRE los 4 neumáticos asignados (excepto baja/recuperado) con el mismo Odometro
    const handleConfirm = async () => {
        // Nuevo: requiere que las 4 posiciones estén asignadas
        const allPositionsAssigned = Object.values(assignedNeumaticos).filter(Boolean).length === 4;

        if (!allPositionsAssigned) {
            setSnackbarMsg('Debes asignar un neumático en las 4 posiciones antes de confirmar.');
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            return;
        }
        // Tomar todos los asignados (excepto baja definitiva o recuperado)
        const toAssign = Object.entries(assignedNeumaticos).filter(
            ([pos, neu]) => {
                if (!neu) return false;
                // Excluir baja definitiva o recuperado
                if (neu.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neu.TIPO_MOVIMIENTO === 'RECUPERADO') return false;
                return true;
            }
        );
        if (toAssign.length === 0) {
            setSnackbarMsg('No hay neumáticos asignados para actualizar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        // Validación robusta de campos requeridos
        const camposRequeridos = ['CODIGO', 'REMANENTE', 'PRESION_AIRE', 'TORQUE_APLICADO'];
        for (const [pos, neu] of toAssign) {
            for (const campo of camposRequeridos) {
                // Permite 0 como valor válido, pero no null, undefined o NaN
                const valor = (neu as any)[campo] ?? (neu as any)[campo.toUpperCase()];
                if (valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '') || (typeof valor === 'number' && isNaN(valor))) {
                    setSnackbarMsg(`Falta completar el campo "${campo}" en la posición ${pos}.`);
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    return;
                }
                // Validación extra: el backend no acepta 0, así que bloqueamos 0 explícitamente
                if (typeof valor === 'number' && valor === 0) {
                    setSnackbarMsg(`El campo "${campo}" no puede ser 0 en la posición ${pos}.`);
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                    return;
                }
            }
        }
        try {
            const payloadArray = toAssign.map(([pos, neu]) => {
                const codigo = Number(neu!.CODIGO ?? neu!.CODIGO_NEU);
                const remanente = typeof neu!.REMANENTE === 'string' ? parseFloat(neu!.REMANENTE) : (neu!.REMANENTE ?? 0);
                const presionAire = typeof neu!.PRESION_AIRE === 'string' ? parseFloat(neu!.PRESION_AIRE) : (neu!.PRESION_AIRE ?? 0);
                const torqueAplicado = typeof neu!.TORQUE_APLICADO === 'string' ? parseFloat(neu!.TORQUE_APLICADO) : (neu!.TORQUE_APLICADO ?? 0);
                const fechaAsignacion = neu!.FECHA_ASIGNACION || new Date().toISOString().slice(0, 10);
                return {
                    CodigoNeumatico: codigo,
                    Remanente: remanente,
                    PresionAire: presionAire,
                    TorqueAplicado: torqueAplicado,
                    Placa: typeof placa === 'string' ? placa.trim() : placa,
                    Posicion: pos,
                    Odometro: Odometro, // SIEMPRE el mismo para todos
                    FechaRegistro: fechaAsignacion,
                };
            });
            console.log('Payload enviado a asignarNeumatico:', payloadArray);
            await asignarNeumatico(payloadArray); // axios ya envía Content-Type: application/json
            setSnackbarMsg('Neumático(s) asignado(s) y kilometraje actualizado.');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            if (typeof onAssignedUpdate === 'function') {
                await onAssignedUpdate();
            }
            onClose();
        } catch (e: any) {
            console.error(e);
            setSnackbarMsg(e.message || 'Error al asignar neumático.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };
    // ------------------------------------------------


    // Definir estados para Odometro, initialOdometro y kmError
    const [Odometro, setOdometro] = useState<number>(kilometro || 0);
    const [initialOdometro, setInitialOdometro] = useState<number>(kilometro || 0);
    const [kmError, setKmError] = useState<boolean>(false);

    // Sincronizar Odometro e initialOdometro cuando cambie la prop kilometro o al abrir el modal
    useEffect(() => {
        setOdometro(kilometro || 0);
        setInitialOdometro(kilometro || 0);
        setKmError(false);
    }, [kilometro, open]);


    return (
        <DndProvider backend={HTML5Backend}>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
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
            <Dialog
                open={open}
                onClose={handleDialogClose}
                maxWidth="xl"
                fullWidth
                disableEnforceFocus
                disableAutoFocus
            >
                <DialogContent>
                    <Stack direction="row" spacing={2}>

                        <Card sx={{ flex: 0.5, p: 2, position: 'relative', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                            {/* <Typography variant="h6" sx={{ mb: 2 }}>
                                Información del Vehículo
                            </Typography> */}
                            <Box sx={{ position: 'relative', width: '100%', height: '650px' }}>
                                <img
                                    src="/assets/car-diagram.png"
                                    alt="Diagrama del Vehículo"
                                    style={{
                                        width: '420px',
                                        height: '650px',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: '10px',
                                        left: '12px',
                                        zIndex: 1,
                                    }}
                                />
                                {/* DropZones */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '120px',
                                        left: '285px',
                                        zIndex: 2,
                                    }}
                                >
                                    <DropZone
                                        position="POS01"
                                        onDrop={(neumatico) => handleDrop('POS01', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS01}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '120px',
                                        left: '113px',
                                        zIndex: 2,
                                    }}
                                >
                                    <DropZone
                                        position="POS02"
                                        onDrop={(neumatico) => handleDrop('POS02', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS02}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '402px',
                                        left: '285px',
                                        zIndex: 2,
                                    }}
                                >
                                    <DropZone
                                        position="POS03"
                                        onDrop={(neumatico) => handleDrop('POS03', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS03}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '402px',
                                        left: '114px',
                                        zIndex: 2,
                                    }}
                                >
                                    <DropZone
                                        position="POS04"
                                        onDrop={(neumatico) => handleDrop('POS04', neumatico)}
                                        isAssigned={!!assignedNeumaticos.POS04}
                                        assignedNeumaticos={assignedNeumaticos}
                                        setAssignedNeumaticos={setAssignedNeumaticos}
                                        kilometro={kilometro}
                                    />
                                </Box>
                                <img
                                    src="/assets/placa.png"
                                    alt="Placa"
                                    style={{
                                        width: '420px',
                                        height: '100px',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: '670px',
                                        left: '12px',
                                        zIndex: 1,
                                    }}
                                />
                                <Typography
                                    variant="h6"
                                    sx={{
                                        position: 'absolute',
                                        top: '700px',
                                        left: '220px',
                                        transform: 'translateX(-50%)',
                                        zIndex: 2,
                                        color: 'black',
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        fontFamily: 'Arial, sans-serif',
                                        fontWeight: 'bold',
                                        fontSize: '40px',
                                        textAlign: 'center',

                                    }}>
                                    {placa}
                                </Typography>
                            </Box>
                        </Card>
                        {/* Neumáticos Actuales y Neumáticos Nuevos */}
                        <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Neumáticos Actuales</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <TextField
                                            label="Kilometro"
                                            type="number"
                                            value={Odometro}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                if (value >= initialOdometro) {
                                                    setOdometro(value);
                                                    setKmError(false);
                                                } else {
                                                    setOdometro(value);
                                                    setKmError(true);
                                                }
                                            }}
                                            fullWidth
                                            error={kmError}
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
                                            sx={{ maxWidth: 180, ml: 2 }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: kmError ? 'error.main' : 'text.secondary',
                                                minWidth: 180,
                                                ml: 1,
                                                whiteSpace: 'nowrap',
                                                fontWeight: kmError ? 'bold' : 'normal',
                                            }}
                                        >
                                            {kmError
                                                ? `No puede ser menor a ${initialOdometro.toLocaleString()} km`
                                                : `Kilometro actual: ${Odometro.toLocaleString()} km`}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        disabled={!hasAssignedNeumaticos || !allPositionsAssigned}
                                        onClick={handleConfirm}
                                    >
                                        Confirmar Asignación
                                    </Button>



                                </Box>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Posición</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Marca</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Medida</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha Asignados</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Situación</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(assignedNeumaticos).map(([position, neumatico]) => {
                                                const esBajaORecuperado = neumatico && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO');
                                                return (
                                                    <TableRow key={position}>
                                                        <TableCell>{position}</TableCell>
                                                        <TableCell>{esBajaORecuperado ? '----' : (neumatico?.CODIGO || '----')}</TableCell>
                                                        <TableCell>{esBajaORecuperado ? '----' : (neumatico?.MARCA || '----')}</TableCell>
                                                        <TableCell>{esBajaORecuperado ? '----' : (neumatico?.MEDIDA || '----')}</TableCell>
                                                        <TableCell>{esBajaORecuperado ? '----' : (neumatico?.FECHA_ASIGNACION || neumatico?.FECHA_REGISTRO || '----')}</TableCell>
                                                        <TableCell>
                                                            {esBajaORecuperado
                                                                ? '----'
                                                                : neumatico?.TIPO_MOVIMIENTO === 'ASIGNADO'
                                                                    ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span>ASIGNADO</span>
                                                                            <CheckBoxIcon style={{ color: 'green' }} />
                                                                        </div>
                                                                    )
                                                                    : (neumatico?.TIPO_MOVIMIENTO || '----')
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                            <Card sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Neumáticos Nuevos</Typography>
                                    <TextField
                                        label="Buscar por Neumáticos"
                                        variant="outlined"
                                        sx={{ maxWidth: '250px' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </Box>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ width: '50px' }} />
                                                <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Marca</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Diseño</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Remanente</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Medida</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedData.length > 0 ? (
                                                paginatedData.map((neumatico) => {
                                                    // 1️⃣ deshabilita si ya viene con TIPO_MOVIMIENTO = 'ASIGNADO'
                                                    const isDisabled = neumatico.TIPO_MOVIMIENTO === 'ASIGNADO';

                                                    return (
                                                        <TableRow
                                                            key={neumatico.CODIGO}
                                                            sx={{
                                                                backgroundColor: isDisabled
                                                                    ? theme.palette.action.disabledBackground
                                                                    : 'inherit',
                                                                pointerEvents: isDisabled ? 'none' : 'auto',
                                                                transition: 'box-shadow 0.2s, background 0.2s',
                                                                '&:hover': !isDisabled
                                                                    ? {
                                                                        boxShadow: '0 2px 12px 0 #bdbdbd', // plomo claro
                                                                        backgroundColor: '#f5f5f5', // fondo gris muy claro
                                                                    }
                                                                    : {},
                                                            }}
                                                        >
                                                            {/* 2️⃣ arrastrable deshabilitado */}
                                                            <TableCell>
                                                                <DraggableNeumatico
                                                                    neumatico={neumatico}
                                                                    disabled={isDisabled}
                                                                />
                                                            </TableCell>

                                                            {/* 3️⃣ resto de columnas */}
                                                            <TableCell>{neumatico.CODIGO}</TableCell>
                                                            <TableCell>{neumatico.MARCA}</TableCell>
                                                            <TableCell>{neumatico.DISEÑO}</TableCell>
                                                            <TableCell>{neumatico.REMANENTE}</TableCell>
                                                            <TableCell>{neumatico.MEDIDA}</TableCell>
                                                            <TableCell>{neumatico.FECHA_REGISTRO}</TableCell>

                                                            {/* 4️⃣ indicador de Estado */}
                                                            <TableCell align="center">
                                                                <Box sx={{ position: 'relative', width: '100px' }}>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={
                                                                            typeof neumatico.ESTADO === 'string'
                                                                                ? parseInt(neumatico.ESTADO.replace('%', ''), 10)
                                                                                : neumatico.ESTADO
                                                                        }
                                                                        sx={{
                                                                            height: 20,
                                                                            borderRadius: 5,
                                                                            '& .MuiLinearProgress-bar': {
                                                                                backgroundColor: 'green',
                                                                            },
                                                                        }}
                                                                    />
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            position: 'absolute',
                                                                            top: 0,
                                                                            left: 0,
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            color: 'white',
                                                                            fontWeight: 'bold',
                                                                        }}
                                                                    >
                                                                        {`${neumatico.ESTADO}%`}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} align="center">
                                                        No hay neumáticos disponibles.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>


                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[3, 5, 10]}
                                    component="div"
                                    count={filteredData.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </Card>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </DndProvider>
    );
};


export default ModalAsignacionNeu;

// IMPORTANTE: Solo handleConfirm dispara onAssignedUpdate (refresco de datos y animación de kilometraje).
// El cierre normal del modal (handleDialogClose/onClose) NO refresca datos ni anima el kilometraje.
// Asegúrate de que el padre (page.tsx) solo refresque datos en onAssignedUpdate, no en onClose.


