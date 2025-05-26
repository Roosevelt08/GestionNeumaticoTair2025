'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Neumaticos, obtenerNeumaticosAsignadosPorPlaca, buscarVehiculoPorPlaca } from '@/api/Neumaticos';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import ModalAsignacionNeu from '@/components/dashboard/integrations/modal-asignacionNeu';
import { Neumatico } from '@/types/types';

export default function Page(): React.JSX.Element {
  const [filterCol1, setFilterCol1] = React.useState('');
  const [filterCol2, setFilterCol2] = React.useState('');
  const [vehiculo, setVehiculo] = React.useState<Vehiculo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error' | 'info'>('success');
  const [animatedKilometraje, setAnimatedKilometraje] = useState(0);
  const [animatedTotalNeumaticos, setAnimatedTotalNeumaticos] = useState(0);
  const [neumaticos, setNeumaticos] = React.useState<Neumatico[]>([]);
  const [neumaticosFiltrados, setNeumaticosFiltrados] = React.useState<Neumatico[]>([]);
  const [neumaticosAsignados, setNeumaticosAsignados] = React.useState<Neumatico[]>([]);
  const [busqueda, setBusqueda] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [openModal, setOpenModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [assignedNeumaticos, setAssignedNeumaticos] = React.useState<{ [key: string]: Neumatico | null }>({});
  const [assignedFromAPI, setAssignedFromAPI] = useState<Neumatico[]>([]);

  interface Vehiculo {
    PLACA: string;
    MARCA: string;
    MODELO: string;
    TIPO: string;
    COLOR: string;
    ANO: number;
    PROYECTO: string;
    KILOMETRAJE: number;
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleFilterChangeCol1 = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilterCol1(value);
    if (value === 'opcionB') {
      setOpenModal(true);
    }
  };

  const handleFilterChangeCol2 = (event: SelectChangeEvent<string>) => {
    setFilterCol2(event.target.value);
  };


  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const placa = event.target.value.trim();
    if (placa) {
      setLoading(true); // Mostrar indicador de carga
      try {
        const vehiculoData = await buscarVehiculoPorPlaca(placa);
        if (!vehiculoData) {
          setSnackbarMessage('Vehículo no encontrado.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setVehiculo(null);
          setNeumaticosFiltrados([]);
          setNeumaticosAsignados([]);
          setLoading(false);
          return;
        }
        setVehiculo(vehiculoData);
        setSnackbarMessage('Vehículo encontrado exitosamente.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        try {
          const asignados = await obtenerNeumaticosAsignadosPorPlaca(placa);
          if (asignados.length === 0) {
            setSnackbarMessage('No hay neumáticos asignados para esta placa.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
          }
          setNeumaticosAsignados(asignados);
        } catch (err) {
          console.error('Error al obtener los neumáticos asignados:', err);
          setSnackbarMessage('Error al obtener los neumáticos asignados.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }

        const listaNeumaticos = await Neumaticos();
        const filtrados: Neumatico[] = listaNeumaticos
          .filter((neumatico: Neumatico) => neumatico.PROYECTO === vehiculoData.PROYECTO)
          .map((neumatico: Neumatico) => ({
            ...neumatico,
            CODIGO: neumatico.CODIGO_NEU || neumatico.CODIGO,
            DISEÑO: neumatico.DISEÑO || '',
            FECHA: neumatico.FECHA || '',
          }));
        setNeumaticos(listaNeumaticos);
        setNeumaticosFiltrados(filtrados);

        animateKilometraje(0, vehiculoData.KILOMETRAJE);
        animateTotalNeumaticos(0, filtrados.length);
      } catch (err) {
        console.error('Error al buscar el vehículo:', err);
        setVehiculo(null);
        setSnackbarMessage('Error al conectar con el servidor.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setNeumaticosFiltrados([]);
        setNeumaticosAsignados([]);
      } finally {
        setLoading(false); // Ocultar indicador de carga
      }
    } else {
      setVehiculo(null);
      setNeumaticosFiltrados([]);
      setNeumaticosAsignados([]);
    }
  };

  const handleBusquedaNeumatico = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valor = event.target.value.toLowerCase();
    setBusqueda(valor);
    const filtrados = neumaticos.filter(
      (neumatico) =>
        (typeof neumatico.CODIGO === 'string' && neumatico.CODIGO.toLowerCase().includes(valor)) ||
        (typeof neumatico.MARCA === 'string' && neumatico.MARCA.toLowerCase().includes(valor))
    );

    setNeumaticosFiltrados(filtrados);
  };

  const animateKilometraje = (start: number, end: number) => {
    const duration = 1000;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentKilometraje = Math.floor(start + (end - start) * progress);
      setAnimatedKilometraje(currentKilometraje);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  const animateTotalNeumaticos = (start: number, end: number) => {
    const duration = 1000;
    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentTotal = Math.floor(start + (end - start) * progress);
      setAnimatedTotalNeumaticos(currentTotal);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  const handleOpenModal = async () => {
    try {
      if (vehiculo) {
        const data = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);

        // Mapea los neumáticos asignados a sus posiciones
        const assigned = data.reduce((acc: { [key: string]: Neumatico | null }, neumatico: Neumatico) => {
          if (neumatico.POSICION !== undefined) {
            acc[neumatico.POSICION] = neumatico;
          }
          return acc;
        }, {} as { [key: string]: Neumatico | null });

        setAssignedNeumaticos(assigned);
        setOpenModal(true);
      } else {
        console.error('No hay un vehículo seleccionado.');
      }
    } catch (error) {
      console.error('Error al obtener los neumáticos:', error);
    }
  };


  const handleCloseModal = () => {
    setOpenModal(false);
  };

  useEffect(() => {
    // Sólo disparar cuando tengamos un objeto de vehículo válido
    if (!vehiculo || !vehiculo.PLACA) return;

    // Llamamos al endpoint y actualizamos el estado
    obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA)
      .then((arr) => {
        console.log("Asignados tras cargar vehículo:", arr);
        setNeumaticosAsignados(arr);
      })
      .catch((err) => {
        console.error("Error trayendo neumáticos asignados:", err);
      });
  }, [vehiculo]);





  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Asignación de Neumáticos</Typography>
        </Stack>
      </Stack>
      <CompaniesFilters onSearchChange={handleSearchChange}
        projectName={vehiculo?.PROYECTO || '—'} />
      <Stack direction="row" spacing={2}>
        <Card sx={{
          flex: 0.8,
          p: 2,
          position: 'relative',
          maxHeight: '700px',
          overflow: 'auto'
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>

            <Stack direction="row" alignItems="center" spacing={2}>
              {vehiculo && (
                <>
                  {/* Kilometraje */}
                  <Box
                    sx={{
                      backgroundColor: '#e0f7fa',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontWeight: 'bold',
                      color: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    {`Último Kilometraje ${animatedKilometraje.toLocaleString()} km`}
                  </Box>
                  {/* Ícono de neumáticos */}
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => setOpenModal(true)} // Solo abre el modal
                  >
                    <img
                      src="/assets/tires-icon.png"
                      alt="Ícono de neumáticos"
                      style={{
                        width: '40px',
                        height: '40px',
                      }}
                    />
                  </Box>
                  {/* Ícono de papelera */}
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => console.log('Eliminar acción')}
                  >
                    <img
                      src="/assets/trash-icon.png"
                      alt="Ícono de papelera"
                      style={{
                        width: '40px',
                        height: '40px',
                      }}
                    />
                  </Box>
                </>
              )}
            </Stack>
          </Stack>
          <Box sx={{ mt: 6 }}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Marca</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Modelo</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Tipo</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Color</TableCell>
                    <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Año</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiculo ? (
                    <TableRow>
                      <TableCell>{vehiculo.MARCA}</TableCell>
                      <TableCell>{vehiculo.MODELO}</TableCell>
                      <TableCell>{vehiculo.TIPO}</TableCell>
                      <TableCell>{vehiculo.COLOR}</TableCell>
                      <TableCell>{vehiculo.ANO}</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {error || 'Ingrese una placa para buscar.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={{ mt: 4, textAlign: 'left', position: 'relative', width: '262px', height: '365px' }}>
            <img
              src="/assets/car-diagram.png"
              alt="Base"
              style={{
                width: '238px',
                height: '424px',
                objectFit: 'contain',
                position: 'absolute',
                top: '-43px',
                left: '-25px',
                zIndex: 1,
              }}
            />
            {/* POS01 */}
            <Box
              sx={{
                position: 'absolute',
                top: '39px',
                left: '133px',
                zIndex: 2,
                width: '26px',
                height: '60px',
                borderRadius: '15px',
                backgroundColor: neumaticosAsignados.some(n => n.POSICION === 'POS01') ? 'lightgreen' : 'transparent',
                border: '2px solid #888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#222',
                fontSize: 18,
                pointerEvents: 'none'
              }}
            >
            </Box>
            {/* POS02 */}
            <Box
              sx={{
                position: 'absolute',
                top: '39px',
                left: '29px',
                zIndex: 2,
                width: '26px',
                height: '60px',
                borderRadius: '15px',
                backgroundColor: neumaticosAsignados.some(n => n.POSICION === 'POS02') ? 'lightgreen' : 'transparent',
                border: '2px solid #888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#222',
                fontSize: 18,
                pointerEvents: 'none'
              }}
            >
            </Box>
            {/* POS03 */}
            <Box
              sx={{
                position: 'absolute',
                top: '208px',
                left: '133px',
                zIndex: 2,
                width: '26px',
                height: '60px',
                borderRadius: '15px',
                backgroundColor: neumaticosAsignados.some(n => n.POSICION === 'POS03') ? 'lightgreen' : 'transparent',
                border: '2px solid #888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#222',
                fontSize: 18,
                pointerEvents: 'none'
              }}
            >
            </Box>
            {/* POS04 */}
            <Box
              sx={{
                position: 'absolute',
                top: '208px',
                left: '29px',
                zIndex: 2,
                width: '26px',
                height: '60px',
                borderRadius: '15px',
                backgroundColor: neumaticosAsignados.some(n => n.POSICION === 'POS04') ? 'lightgreen' : 'transparent',
                border: '2px solid #888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#222',
                fontSize: 18,
                pointerEvents: 'none'
              }}
            >
            </Box>

          </Box>
        </Card>
        <Card sx={{
          flex: 1.3,
          p: 2,
          position: 'relative',
          maxHeight: '700px', // Ajusta este valor según lo que necesites
          overflow: 'auto'
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Neumáticos instalados en esta unidad :
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Posición</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Codi Neu</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Marca</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Medida</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Remanente</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {neumaticosAsignados.length > 0 ? (
                  neumaticosAsignados.map((neumatico, index) => (
                    <TableRow key={neumatico.ID}>
                      <TableCell align="center">{neumatico.POSICION}</TableCell>
                      <TableCell align="center">{neumatico.CODIGO_NEU}</TableCell>
                      <TableCell align="center">{neumatico.MARCA}</TableCell>
                      <TableCell align="center">{neumatico.MEDIDA}</TableCell>
                      <TableCell align="center">{neumatico.REMANENTE}%</TableCell>
                      <TableCell align="center">{neumatico.ESTADO}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay neumáticos asignados para esta placa.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6"> </Typography>
              <Box
                sx={{
                  backgroundColor: '#e0f7fa',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 'bold',
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                {`Disponibles: ${neumaticosFiltrados.filter(n => n.ESTADO_ASIGNACION === 'DISPONIBLE').length.toLocaleString()} Neumáticos`}
              </Box>
            </Stack>
            <OutlinedInput
              fullWidth
              placeholder="Buscar neumáticos"
              value={busqueda}
              onChange={handleBusquedaNeumatico}
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyingGlass fontSize="var(--icon-fontSize-md)" />
                </InputAdornment>
              }
              sx={{ maxWidth: '250px' }}
              disabled={!vehiculo}
            />
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Código</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Marca</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Diseño</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Remanente</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Medida</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {neumaticosFiltrados
                  .filter(n => n.ESTADO_ASIGNACION === 'DISPONIBLE')
                  .slice(page * 5, page * 5 + 5)
                  .map((neumatico) => (
                    <TableRow key={neumatico.CODIGO}>
                      <TableCell align="center">{neumatico.CODIGO}</TableCell>
                      <TableCell align="center">{neumatico.MARCA}</TableCell>
                      <TableCell align="center">{neumatico.DISEÑO}</TableCell>
                      <TableCell align="center">{neumatico.REMANENTE}</TableCell>
                      <TableCell align="center">{neumatico.MEDIDA}</TableCell>
                      <TableCell align="center">{neumatico.FECHA}</TableCell>
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
                              [`& .MuiLinearProgress-bar`]: {
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
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[]}
            component="div"
            count={neumaticosFiltrados.length}
            rowsPerPage={5}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={undefined}
          />
        </Card>
      </Stack>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <ModalAsignacionNeu
        open={openModal}
        onClose={() => {
          handleCloseModal();
          if (vehiculo?.PLACA) {
            obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA).then(setNeumaticosAsignados);
          }
        }}
        data={neumaticosFiltrados.map((neumatico) => ({
          ...neumatico,
          CODIGO: neumatico.CODIGO_NEU ?? neumatico.CODIGO, // Usar CODIGO_NEU si existe, de lo contrario usar CODIGO
          DISEÑO: neumatico.DISEÑO ?? '', // Proveer un valor por defecto si falta
          FECHA: neumatico.FECHA ?? '', // Proveer un valor por defecto si falta
        }))}
        assignedNeumaticos={neumaticosAsignados} // Pasar los neumáticos asignados
        placa={vehiculo?.PLACA ?? ''} // Pasar la placa del vehículo
        kilometraje={vehiculo?.KILOMETRAJE ?? 0}
      />

    </Stack>
  );
}
