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

const ItemType = {
    NEUMATICO: 'neumatico',
};


export interface ModalAsignacionNeuProps {
    open: boolean;
    onClose: () => void;
    data: Neumatico[];
    assignedNeumaticos: Neumatico[]; // Added this property
    placa: string;
    kilometraje: number;
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
}

interface ModalInputsNeuData {
    kilometraje: number;
    remanente: number;
    presionAire: number;
}

const DropZone: React.FC<DropZoneProps> = ({
    position,
    onDrop,
    isAssigned,
    assignedNeumaticos,
    setAssignedNeumaticos,
}) => {
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
    const [dropBlocked, setDropBlocked] = React.useState<boolean>(false);
    const [lastRemovedCode, setLastRemovedCode] = React.useState<string | null>(null);
    const [isShaking, setIsShaking] = React.useState<boolean>(false);
    const [inputsModalOpen, setInputsModalOpen] = React.useState<boolean>(false);

    const triggerShake = (): void => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600); // Dura 600ms
    };
    const handleInputsModalSubmit = (data: ModalInputsNeuData): void => {
        console.log('Datos del modal pequeño:', data);
        // Aquí puedes manejar los datos del modal pequeño
    };

    const [, drop] = useDrop<
        Neumatico,
        void,
        unknown
    >(() => ({
        accept: ItemType.NEUMATICO,
        drop: (item: Neumatico) => {
            // Evita drops en condiciones no válidas
            if (isModalOpen || dropBlocked) return;

            // Ignorar si el neumático es justo el que se acaba de eliminar
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
                setTimeout(() => {
                    triggerShake();
                }, 0);
            } else {
                setInputsModalOpen(true); // Abrir el modal pequeño
            }

            // Activar animación de shake si es necesario
            if (shouldShake) {
                setTimeout(() => {
                    triggerShake();
                }, 0);
            }
        },
    }));

    const ref = React.useRef<HTMLDivElement>(null);
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
                backgroundColor: isAssigned ? 'lightgreen' : 'transparent', // Pintar de verde si está asignado
                borderRadius: '20px',
                border: 'none',
                pointerEvents: 'all',
                cursor: isAssigned ? 'pointer' : 'default',
                boxShadow: isShaking ? '0 0 10px 4px red' : 'none',
                transition: 'box-shadow 0.2s ease-in-out',
            }}
        >
            {isAssigned && (
                <span>
                    {assignedNeumaticos[position]?.CODIGO || '🛞'}
                </span>
            )}

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
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
            />
        </div>
    );
};




const ModalAsignacionNeu: React.FC<ModalAsignacionNeuProps> = ({ open, onClose, data, assignedNeumaticos: initialAssignedNeumaticos, placa, kilometraje }) => {

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
                const pos = neu.POSICION;      // ① extraigo pos
                if (pos && mapa.hasOwnProperty(pos)) {
                    mapa[pos] = neu;             // ② sólo asigno si pos es válida
                }
            });
            return mapa;
        },
        [initialAssignedNeumaticos]
    );


    const [assignedNeumaticos, setAssignedNeumaticos] = useState(initialAssignedMap);






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
    }, [open, initialAssignedMap]);


    useEffect(() => {
        console.log("Assigned Neumaticos:", assignedNeumaticos);
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
                neumatico.ESTADO_ASIGNACION === 'DISPONIBLE' &&
                (neumatico.CODIGO.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    neumatico.MARCA.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredData, page, rowsPerPage]);


    // ------------------------------------------------
    // Solo asigna al backend las posiciones que antes estaban vacías
    const handleConfirm = async () => {
        const toAssign = Object.entries(assignedNeumaticos).filter(
            ([pos, neu]) => neu !== null && initialAssignedMap[pos] == null
        );
        if (toAssign.length === 0) {
            alert("No hay cambios pendientes.");
            return;
        }
        try {
            // Usar la función centralizada de la API
            await Promise.all(
                toAssign.map(([pos, neu]) => {
                    const codigo = neu!.CODIGO ?? neu!.CODIGO_NEU;
                    return asignarNeumatico({
                        Placa: placa,
                        Posicion: pos,
                        CodigoNeumatico: codigo,
                        Odometro: kilometraje,
                        Observacion: "Asignado desde UI",
                    });
                })
            );
            alert("Asignación completada.");
            onClose();
        } catch (e: any) {
            console.error(e);
            alert(e.message);
        }
    };
    // ------------------------------------------------


    return (
        <DndProvider backend={HTML5Backend}>
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
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        disabled={!hasAssignedNeumaticos}
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
                                            {Object.entries(assignedNeumaticos).map(([position, neumatico]) => (
                                                <TableRow key={position}>
                                                    <TableCell>{position}</TableCell>
                                                    <TableCell>{neumatico?.CODIGO || '----'}</TableCell>
                                                    <TableCell>{neumatico?.MARCA || '----'}</TableCell>
                                                    <TableCell>{neumatico?.MEDIDA || '----'}</TableCell>
                                                    <TableCell>{neumatico?.FECHA_ASIGNADO || '----'}</TableCell>
                                                    <TableCell>
                                                        {neumatico?.ESTADO === 'ASIGNADO' ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span>ASIGNADO</span>
                                                                <CheckBoxIcon style={{ color: 'green' }} />
                                                            </div>
                                                        ) : (
                                                            neumatico?.ESTADO || '----'
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
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
                                                    // 1️⃣ deshabilita si ya viene con ESTADO_ASIGNACION = 'ASIGNADO'
                                                    const isDisabled = neumatico.ESTADO_ASIGNACION === 'ASIGNADO';

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
                                                            <TableCell>{neumatico.FECHA}</TableCell>

                                                            {/* 4️⃣ indicador de Estado */}
                                                            <TableCell align="center">
                                                                <Box sx={{ position: 'relative', width: '100px' }}>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={
                                                                            typeof neumatico.ESTADO === 'string'
                                                                                ? parseInt(
                                                                                    neumatico.ESTADO.replace('%', ''),
                                                                                    10
                                                                                )
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
