import * as React from 'react';
import Box from '@mui/material/Box';

interface Neumatico {
    POSICION: string;
    CODIGO_NEU?: string;
    CODIGO?: string;
    POSICION_NEU?: string;
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

const DiagramaVehiculo: React.FC<DiagramaVehiculoProps & { onPosicionClick?: (neumatico: Neumatico | undefined) => void; soloMantenimiento?: boolean; onMantenimientoClick?: () => void }> = ({ neumaticosAsignados = [], layout = 'dashboard', onPosicionClick, soloMantenimiento, ...props }) => {
    const pos = posiciones[layout];
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
            {layout === 'modal' && soloMantenimiento && (
                <>
                    <img src="/assets/rotar.png" alt="Rotar" title="Rotar" style={{ position: 'absolute', top: '100px', left: '40px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain' }} />
                    <img src="/assets/reparar.png" alt="Reparar" title="Reparar" style={{ position: 'absolute', top: '160px', left: '40px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain' }} />
                    <img src="/assets/recaucar.png" alt="Recauchar" title="Recauchar" style={{ position: 'absolute', top: '220px', left: '40px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain' }} />
                    <img src="/assets/desasignar.png" alt="Desasignar" title="Desasignar" style={{ position: 'absolute', top: '280px', left: '40px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain' }} />
                    <img src="/assets/dar de baja.png" alt="Dar de baja" title="Dar de baja" style={{ position: 'absolute', top: '340px', left: '40px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain' }} />
                </>
            )}
            {/* Acciones rápidas solo en modal de inspección */}
            {layout === 'modal' && !soloMantenimiento && (
                <>
                    <Box component="span" sx={{ position: 'absolute', top: '270px', left: '40px', zIndex: 2 }}>
                        <img
                            src="/assets/neu_matenimiento.png"
                            alt="Mantenimiento neumático"
                            style={{ width: '60px', height: '60px', objectFit: 'contain', cursor: 'pointer' }}
                            onClick={props.onMantenimientoClick}
                        />
                        <Box sx={{ position: 'absolute', top: '-28px', left: '0', width: 'max-content', bgcolor: 'rgba(0,0,0,0.8)', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontSize: 12, pointerEvents: 'none', opacity: 0, transition: 'opacity 0.2s', zIndex: 10 }} className="tooltip-mantenimiento">
                            Abrir mantenimiento
                        </Box>
                    </Box>
                    <Box component="span" sx={{ position: 'absolute', top: '340px', left: '40px', zIndex: 2 }}>
                        <img src="/assets/trash-icon.png" alt="Eliminar neumático" style={{ width: '60px', height: '60px', objectFit: 'contain', cursor: 'pointer' }} />
                        <Box sx={{ position: 'absolute', top: '-28px', left: '0', width: 'max-content', bgcolor: 'rgba(0,0,0,0.8)', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontSize: 12, pointerEvents: 'none', opacity: 0, transition: 'opacity 0.2s', zIndex: 10 }} className="tooltip-eliminar">
                            Eliminar neumático
                        </Box>
                    </Box>
                </>
            )}

            {pos.map(({ key, top, left }) => {
                const neumatico = neumaticosAsignados.find(n => n.POSICION === key);
                return (
                    <Box
                        key={key}
                        sx={{
                            position: 'absolute',
                            top,
                            left,
                            zIndex: 2,
                            width: '26px',
                            height: '58px',
                            borderRadius: '15px',
                            backgroundColor: neumatico ? 'lightgreen' : 'transparent',
                            border: '2px solid #888',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            color: '#222',
                            fontSize: 18,
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s',
                            boxShadow: neumatico ? '0 0 8px 2px #4caf50' : 'none',
                        }}
                        onClick={() => onPosicionClick && onPosicionClick(neumatico)}
                        title={key + (neumatico ? ` - ${neumatico.CODIGO_NEU || neumatico.CODIGO || ''}` : '')}
                    >
                        {neumatico ? (
                            <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#333' }}>
                                {neumatico.CODIGO_NEU || neumatico.CODIGO}
                            </span>
                        ) : (
                            key.replace('POS', '')
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

export default DiagramaVehiculo;
