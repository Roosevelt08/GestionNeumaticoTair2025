import * as React from 'react';
import Box from '@mui/material/Box';

interface Neumatico {
    POSICION: string;
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

const DiagramaVehiculo: React.FC<DiagramaVehiculoProps> = ({ neumaticosAsignados, layout = 'dashboard' }) => {
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
            {pos.map(({ key, top, left }) => (
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
                        backgroundColor: neumaticosAsignados.some(n => n.POSICION === key) ? 'lightgreen' : 'transparent',
                        border: '2px solid #888',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#222',
                        fontSize: 18,
                        pointerEvents: 'none',
                    }}
                />
            ))}
        </Box>
    );
};

export default DiagramaVehiculo;
