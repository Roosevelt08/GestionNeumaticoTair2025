import * as React from 'react';
import Box from '@mui/material/Box';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { consultarInspeccionHoy } from '../../../api/Neumaticos';

interface Neumatico {
    POSICION: string;
    CODIGO_NEU?: string;
    CODIGO?: string;
    POSICION_NEU?: string;
    ESTADO?: string | number;
    ID_MOVIMIENTO?: number | string;
    TIPO_MOVIMIENTO?: string;
}

interface DiagramaVehiculoProps {
    neumaticosAsignados: Neumatico[];
    layout?: 'dashboard' | 'modal';
}

const posiciones = {
    dashboard: [
        { key: 'POS01', top: '39px', left: '133px' },
        { key: 'POS02', top: '39px', left: '29px' },
        { key: 'POS03', top: '208px', left: '133px' },
        { key: 'POS04', top: '208px', left: '29px' },
    ],
    modal: [
        { key: 'POS01', top: '124px', left: '282px' },
        { key: 'POS02', top: '124px', left: '182px' },
        { key: 'POS03', top: '288px', left: '282px' },
        { key: 'POS04', top: '288px', left: '182px' },
    ],
};

const DiagramaVehiculo: React.FC<DiagramaVehiculoProps & {
    onPosicionClick?: (neumatico: Neumatico | undefined) => void;
    onMantenimientoClick?: () => void;
    onRotarClick?: () => void;
    onDesasignarClick?: () => void;
    fromMantenimientoModal?: boolean;
    placa?: string; // <-- Asegúrate de pasar la placa desde el padre
}> = ({ neumaticosAsignados = [], layout = 'dashboard', onPosicionClick, onRotarClick, onDesasignarClick, fromMantenimientoModal, placa, ...props }) => {
    const pos = posiciones[layout];
    const neumaticosFiltrados = React.useMemo(() => {
        // 1. Filtrar por posición: el movimiento más reciente por posición
        const porPosicion = new Map<string, Neumatico>();
        for (const n of neumaticosAsignados) {
            // Excluir BAJA DEFINITIVA y RECUPERADO
            if (n.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || n.TIPO_MOVIMIENTO === 'RECUPERADO') continue;
            const pos = n.POSICION;
            if (!pos) continue;
            if (!porPosicion.has(pos) || ((n.ID_MOVIMIENTO || 0) > (porPosicion.get(pos)?.ID_MOVIMIENTO || 0))) {
                porPosicion.set(pos, n);
            }
        }
        // 2. Filtrar por código: solo dejar el movimiento más reciente por código
        const porCodigo = new Map<string, Neumatico>();
        for (const n of porPosicion.values()) {
            const codigo = n.CODIGO_NEU || n.CODIGO;
            if (!codigo) continue;
            if (!porCodigo.has(codigo) || ((n.ID_MOVIMIENTO || 0) > (porCodigo.get(codigo)?.ID_MOVIMIENTO || 0))) {
                porCodigo.set(codigo, n);
            }
        }
        return Array.from(porCodigo.values());
    }, [neumaticosAsignados]);
    // Handler para click en rotar con validación de inspección
    const handleRotarClick = async () => {
        // Tomar el primer neumático asignado (puedes ajustar la lógica si es por posición específica)
        const neu = neumaticosFiltrados[0];
        if (!neu || !placa) {
            alert('No se puede validar inspección: falta neumático o placa');
            return;
        }
        const codigo = neu.CODIGO_NEU || neu.CODIGO;
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        const fechaHoy = `${yyyy}-${mm}-${dd}`;
        try {
            const resp = await consultarInspeccionHoy({ codigo, placa, fecha: fechaHoy });
            if (resp.existe) {
                if (onRotarClick) onRotarClick();
            } else {
                let msg = 'Realiza una inspección, ya que la última inspección fue ';
                msg += resp.ultima ? resp.ultima : 'NUNCA';
                // alert(msg);
                if (window && typeof window !== 'undefined') {
                    alert(msg);
                }
                // Si tienes una función para abrir el modal de inspección, llámala aquí
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('abrir-modal-inspeccion'));
                }
            }
        } catch (e) {
            if (e instanceof Error) {
                alert('Error al consultar inspección: ' + e.message);
            } else {
                alert('Error al consultar inspección: ' + String(e));
            }
        }
    };
    return (
        <Box
            sx={
                layout === 'dashboard'
                    ? { position: 'relative', width: '262px', height: '365px' }
                    : { position: 'relative', width: '370px', height: '430px' }
            }
        >
            <img
                src="/assets/car-diagram.png"
                alt="Base"
                style={
                    layout === 'dashboard'
                        ? {
                            width: '238px',
                            height: '424px',
                            objectFit: 'contain',
                            position: 'absolute',
                            top: '-43px',
                            left: '-25px',
                            zIndex: 1,
                        }
                        : {
                            width: '250px',
                            height: '380px',
                            objectFit: 'contain',
                            position: 'absolute',
                            top: '60px',
                            left: '120px',
                            zIndex: 1,
                        }
                }
            />
            {/* Acciones rápidas solo en modal de mantenimiento */}
            {layout === 'modal' && fromMantenimientoModal && (
                <>
                    <img src="/assets/rotar.png" alt="Reubicar" title="Reubicar" style={{ position: 'absolute', top: '280px', left: '40px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain', cursor: 'pointer' }} onClick={handleRotarClick} />
                    <img src="/assets/desasignar.png" alt="Desasignar" title="Desasignar" style={{ position: 'absolute', top: '340px', left: '40px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain', cursor: 'pointer' }} onClick={onDesasignarClick} />
                </>
            )}
            {pos.map(({ key, top, left }) => (
                <PosicionNeumatico
                    key={key}
                    keyPos={key}
                    top={top}
                    left={left}
                    neumatico={neumaticosFiltrados.find(n => n.POSICION === key)}
                    layout={layout}
                    onPosicionClick={onPosicionClick}
                />
            ))}
        </Box>
    );
};

// Nuevo componente hijo para cada posición
const PosicionNeumatico: React.FC<{
    keyPos: string;
    top: string;
    left: string;
    neumatico: Neumatico | undefined;
    layout: 'dashboard' | 'modal';
    onPosicionClick?: (neumatico: Neumatico | undefined) => void;
}> = ({ keyPos, top, left, neumatico, layout, onPosicionClick }) => {
    // Drop target para cada posición
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: keyPos });
    // Siempre ejecuta el hook, pero solo activa el draggable si hay neumático
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION) : keyPos,
        disabled: !neumatico,
        data: neumatico ? { ...neumatico, from: keyPos } : undefined,
    });
    // Determinar color según el estado
    let estado = undefined;
    if (neumatico && neumatico.ESTADO !== undefined && neumatico.ESTADO !== null && neumatico.ESTADO !== '') {
        estado = typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO;
    }
    let bgColor = 'transparent';
    if (estado !== undefined && !isNaN(estado)) {
        if (estado < 39) bgColor = '#d32f2f';
        else if (estado < 79) bgColor = '#ffa726';
        else bgColor = '#2e7d32';
    } else if (neumatico) {
        bgColor = 'lightgreen';
    }
    // Forzar log en el pointerDown del área de drag
    const handlePointerDown = (e: React.PointerEvent) => {
        if (neumatico) {
            console.log('[DiagramaVehiculo] pointerDown en neumático', {
                id: neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION,
                e
            });
        }
        if (listeners && listeners.onPointerDown) {
            listeners.onPointerDown(e);
        }
    };
    // Unir refs de draggable y droppable
    const combinedRef = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        setDropRef(node);
    };
    return (
        <Box
            ref={combinedRef}
            key={keyPos}
            aria-label={neumatico ? `Arrastrar neumático ${neumatico.CODIGO_NEU || neumatico.CODIGO}` : undefined}
            {...attributes}
            onPointerDown={neumatico ? handlePointerDown : undefined}
            sx={{
                position: 'absolute',
                top,
                left,
                zIndex: 2,
                width: layout === 'modal' ? '25px' : '26px',
                height: layout === 'modal' ? '58px' : '58px',
                borderRadius: '15px',
                backgroundColor: isOver ? '#e0f7fa' : bgColor,
                border: isOver ? '2px solid #388e3c' : '2px solid #888',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#222',
                fontSize: 18,
                cursor: neumatico ? 'grab' : 'pointer',
                transition: 'box-shadow 0.2s, background 0.2s, border 0.2s',
                boxShadow: neumatico && isDragging ? '0 0 16px 4px #388e3c' : neumatico ? '0 0 8px 2px #4caf50' : 'none',
                opacity: neumatico && isDragging ? 0.5 : 1,
                userSelect: 'none',
                outline: neumatico && isDragging ? '2px solid #388e3c' : 'none',
            }}
            onClick={() => onPosicionClick && onPosicionClick(neumatico ? { ...neumatico, POSICION: keyPos } : undefined)}
            title={keyPos + (neumatico ? ` - ${neumatico.CODIGO_NEU || neumatico.CODIGO || ''}` : '')}
        >
            {/* {neumatico && layout === 'modal' && (
                <img src="/assets/neumatico.png" alt="neumático" style={{ width: 28, height: 48, marginBottom: 2, pointerEvents: 'none' }} />
            )} */}
            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#333', pointerEvents: 'none' }}>
                {neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : keyPos.replace('POS', '')}
            </span>
        </Box>
    );
};

export default DiagramaVehiculo;
