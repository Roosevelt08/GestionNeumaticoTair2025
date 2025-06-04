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
import { obtenerUltimosMovimientosPorCodigo } from '../../../api/Neumaticos';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

// Ampliar la interfaz para evitar errores de propiedades
interface Neumatico {
    POSICION: string;
    CODIGO?: string;
    CODIGO_NEU?: string;
    MARCA?: string;
    MODELO?: string;
    MEDIDA?: string;
    DISEÑO?: string;
    REMANENTE?: string | number;
    PRESION_AIRE?: string | number;
    TORQUE_APLICADO?: string | number;
    ESTADO?: string | number;
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
        presion_aire: '',
        torque: '',
        tipo_movimiento: '',
        estado: '',
        observacion: '',
        fecha_inspeccion: '',
    });

    // Estado local para los neumáticos asignados (para poder actualizar al hacer drop)
    const [neumaticosAsignadosState, setNeumaticosAsignadosState] = useState<Neumatico[]>(neumaticosAsignados);

    // Estado para la acción seleccionada (REUBICADO o DESASIGNAR)
    const [accion, setAccion] = useState<'REUBICADO' | 'DESASIGNAR' | null>(null);

    // Actualizar el estado local si cambian los props
    React.useEffect(() => {
        setNeumaticosAsignadosState(neumaticosAsignados);
    }, [neumaticosAsignados]);

    // Cuando se selecciona un neumático, llenar el formulario
    const handleSeleccionarNeumatico = async (neumatico: any) => {
        setNeumaticoSeleccionado(neumatico);
        let ultimoKilometro = vehiculo?.kilometro?.toString() ?? '';
        // Buscar el último movimiento por código
        try {
            const codigoBuscar = neumatico.CODIGO_NEU || neumatico.CODIGO;
            if (codigoBuscar) {
                const mov = await obtenerUltimosMovimientosPorCodigo(codigoBuscar);
                if (mov && mov.length > 0 && mov[0].KILOMETRO !== undefined && mov[0].KILOMETRO !== null) {
                    ultimoKilometro = mov[0].KILOMETRO.toString();
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
            remanente: neumatico.REMANENTE?.toString() ?? '',
            presion_aire: neumatico.PRESION_AIRE?.toString() ?? '',
            torque: neumatico.TORQUE_APLICADO?.toString() ?? '',
            tipo_movimiento: '',
            estado: neumatico.ESTADO ?? '',
            fecha_inspeccion: new Date().toISOString().slice(0, 16), // Fecha y hora actual
            observacion: '',
        });
        if (onSeleccionarNeumatico) onSeleccionarNeumatico(neumatico);
    };

    // Manejar cambios en los inputs
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    // Lógica para actualizar la posición del neumático al hacer drop
    const handleDropNeumatico = (neumatico: Neumatico, nuevaPosicion: string) => {
        setNeumaticosAsignadosState(prev =>
            prev.map(n =>
                (n.CODIGO_NEU || n.CODIGO || n.POSICION) === (neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION)
                    ? { ...n, POSICION: nuevaPosicion }
                    : n.POSICION === nuevaPosicion
                        ? { ...n, POSICION: '' } // Vacía la posición anterior si había otro
                        : n
            )
        );
    };

    // Manejar el drop de neumático en una posición
    const handleDragEnd = (event: any) => {
        const { over, active } = event;
        if (over && active) {
            if (over.id === 'neumaticos-por-rotar') {
                // Drop en el card: desasignar
                const neu = neumaticosAsignadosState.find(n => (n.CODIGO_NEU || n.CODIGO || n.POSICION) === active.id);
                if (neu && neu.POSICION) {
                    handleDropNeumatico(neu, '');
                }
            } else if (typeof over.id === 'string' && over.id.startsWith('POS')) {
                // Drop en una posición del diagrama
                const neu = neumaticosAsignadosState.find(n => (n.CODIGO_NEU || n.CODIGO || n.POSICION) === active.id);
                if (neu && over.id) {
                    handleDropNeumatico(neu, over.id);
                }
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            {/* <DialogTitle sx={{ fontWeight: 'bold', color: '#388e3c' }}>Inspección de Neumáticos</DialogTitle> */}
            <DialogContent>
                <DndContext onDragEnd={handleDragEnd}>
                    <Stack direction="row" spacing={2}>
                        <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>Datos del vehículo en Mantenimiento</Typography>
                                    {vehiculo ? (
                                        <Stack direction="row" spacing={4} alignItems="flex-start" sx={{ mb: 1 }}>
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
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">No hay datos del vehículo.</Typography>
                                    )}
                                </Box>
                            </Card>
                            {/* Mostrar solo el card correspondiente según la acción */}
                            {accion === 'REUBICADO' && (
                                <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                                        <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>REUBICADO</Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <TextField
                                            label="Fecha y hora de inspección"
                                            name="fecha_inspeccion"
                                            size="small"
                                            type="datetime-local"
                                            value={formValues.fecha_inspeccion || new Date().toISOString().slice(0, 16)}
                                            onChange={e => setFormValues(prev => ({ ...prev, fecha_inspeccion: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ max: new Date().toISOString().slice(0, 16) }}
                                            sx={{ minWidth: 220, mb: 0 }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
                                        <TextField
                                            label="Observación"
                                            name="observacion"
                                            size="small"
                                            multiline
                                            minRows={2}
                                            value={formValues.observacion}
                                            onChange={handleInputChange}
                                            sx={{ minWidth: 220, flex: 1 }}
                                        />
                                        <DropNeumaticosPorRotar onDropNeumatico={neu => handleDropNeumatico(neu, '')}>
                                            <Box sx={{
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
                                            }}>
                                                <Stack direction="row" spacing={1} alignItems="flex-end">
                                                    {(neumaticosAsignadosState || []).filter(n => !n.POSICION).map((neu, idx) => (
                                                        <Box key={neu.CODIGO_NEU || neu.CODIGO || neu.POSICION || idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                                                            <DraggableNeumatico neumatico={neu} />
                                                            <NeumaticoInfo neumatico={neu} />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </DropNeumaticosPorRotar>
                                    </Box>
                                </Card>
                            )}
                            {accion === 'DESASIGNAR' && (
                                <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                                        <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>DESASIGNAR</Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <TextField
                                            label="Fecha y hora de inspección"
                                            name="fecha_inspeccion"
                                            size="small"
                                            type="datetime-local"
                                            value={formValues.fecha_inspeccion || new Date().toISOString().slice(0, 16)}
                                            onChange={e => setFormValues(prev => ({ ...prev, fecha_inspeccion: e.target.value }))}
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ max: new Date().toISOString().slice(0, 16) }}
                                            sx={{ minWidth: 220, mb: 0 }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 220, flex: 1 }}>
                                            <TextField
                                                select
                                                label="Código"
                                                name="codigo"
                                                size="small"
                                                value={formValues.codigo}
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
                                        <DropNeumaticosPorRotar onDropNeumatico={neu => handleDropNeumatico(neu, '')}>
                                            <Box sx={{
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
                                            }}>
                                                <Stack direction="row" spacing={1} alignItems="flex-end">
                                                    {(neumaticosAsignadosState || []).filter(n => !n.POSICION).map((neu, idx) => (
                                                        <Box key={neu.CODIGO_NEU || neu.CODIGO || neu.POSICION || idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                                                            <DraggableNeumatico neumatico={neu} />
                                                            <NeumaticoInfo neumatico={neu} />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </DropNeumaticosPorRotar>
                                    </Box>
                                </Card>
                            )}
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
                                    neumaticosAsignados={neumaticosAsignadosState}
                                    layout="modal"
                                    onPosicionClick={handleSeleccionarNeumatico}
                                    onRotarClick={() => setAccion('REUBICADO')}
                                    onDesasignarClick={() => setAccion('DESASIGNAR')}
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
        <div ref={setNodeRef} style={{ ...style, transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }} {...listeners} {...attributes}>
            <img
                src={"/assets/neumatico.png"}
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
            {neumatico.MARCA}
        </Typography>
    </>
);

// Drop target para el card de Neumáticos por Rotar
export const DropNeumaticosPorRotar: React.FC<{ onDropNeumatico: (neumatico: Neumatico) => void; children: React.ReactNode }> = ({ onDropNeumatico, children }) => {
    const { setNodeRef, isOver, active } = useDroppable({ id: 'neumaticos-por-rotar' });
    React.useEffect(() => {
        if (isOver && active && active.data?.current) {
            const neu = active.data.current;
            if (neu && neu.POSICION) {
                onDropNeumatico({ ...neu, POSICION: '' });
            }
        }
        // eslint-disable-next-line
    }, [isOver]);
    return (
        <Box ref={setNodeRef} sx={{
            minHeight: 120,
            width: '300px',
            maxWidth: '100%', // No se sale del card
            background: isOver ? '#e0f7fa' : '#fafafa',
            border: isOver ? '2px solid #388e3c' : '1px solid #bdbdbd',
            borderRadius: 2,
            p: 1,
            transition: 'background 0.2s, border 0.2s',
            overflowX: 'auto',
        }}>
            {children}

        </Box>
    );
};

export default ModalInpeccionNeu;
