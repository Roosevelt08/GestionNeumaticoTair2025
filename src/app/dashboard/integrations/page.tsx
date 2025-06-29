'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Neumaticos, obtenerNeumaticosAsignadosPorPlaca, buscarVehiculoPorPlaca, obtenerCantidadAutosDisponibles, obtenerUltimosMovimientosPorPlaca, obtenerUltimosMovimientosPorCodigo } from '@/api/Neumaticos';
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
import ModalDeleteNeu from '@/components/dashboard/integrations/modal-deleteNeu';
import ModalInpeccionNeu from '@/components/dashboard/integrations/modal-inspeccionNeu';
import ModalMantenimientoNeu from '@/components/dashboard/integrations/modal-mantenimientoNeu';
import DiagramaVehiculo from '@/styles/theme/components/DiagramaVehiculo';
import { Neumatico } from '@/types/types';
import { useUser } from '@/hooks/use-user';

export default function Page(): React.JSX.Element {
  const { user } = useUser();
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
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);
  const [openInspeccionModal, setOpenInspeccionModal] = React.useState(false);
  const [openMantenimientoModal, setOpenMantenimientoModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [assignedNeumaticos, setAssignedNeumaticos] = React.useState<{ [key: string]: Neumatico | null }>({});
  const [assignedFromAPI, setAssignedFromAPI] = useState<Neumatico[]>([]);
  const [autosDisponiblesCount, setAutosDisponiblesCount] = useState<number>(0);

  interface Vehiculo {
    PLACA: string;
    MARCA: string;
    MODELO: string;
    TIPO: string;
    COLOR: string;
    ANO: number;
    PROYECTO: string;
    OPERACION?: string;
    KILOMETRO: number;
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

        // Obtener los movimientos de neumáticos y calcular el último kilometraje real
        const movimientos = await obtenerUltimosMovimientosPorPlaca(placa);
        setNeumaticosAsignados(movimientos);
        // Calcular el mayor kilometraje de los movimientos (tipado explícito)
        const odometros = (movimientos as any[])
          .map((n: any) => Number(n.Odometro ?? n.ODOMETRO ?? n.KILOMETRO ?? n.KILOMETRAJE))
          .filter((v: number) => !isNaN(v) && v > 0);
        const ultimoKmReal = odometros.length > 0 ? Math.max(...odometros) : Number(vehiculoData.KILOMETRO ?? vehiculoData.KILOMETRAJE ?? 0);
        animateKilometraje(0, ultimoKmReal);

        const listaNeumaticos = await Neumaticos();
        // Filtrar por USUARIO_SUPER si existe user
        const filtrados: Neumatico[] = listaNeumaticos
          .filter((neumatico: any) =>
            neumatico.PROYECTO === vehiculoData.PROYECTO &&
            (!user?.usuario || neumatico.USUARIO_SUPER === user.usuario)
          )
          .map((neumatico: Neumatico) => ({
            ...neumatico,
            CODIGO: neumatico.CODIGO_NEU || neumatico.CODIGO,
            DISEÑO: neumatico.DISEÑO || '',
            FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD || '',
          }));
        setNeumaticos(listaNeumaticos);
        setNeumaticosFiltrados(filtrados);
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
          if (neumatico.POSICION_NEU !== undefined) {
            acc[neumatico.POSICION_NEU] = neumatico;
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

  // Nuevo: manejar selección de vehículo desde el modal de todas las placas
  const handleVehiculoSeleccionado = (vehiculoSeleccionado: any) => {
    setVehiculo(vehiculoSeleccionado);
    setError(null);
    animateKilometraje(0, vehiculoSeleccionado.KILOMETRAJE);
    // Cargar solo los neumáticos asignados a la placa seleccionada
    obtenerNeumaticosAsignadosPorPlaca(vehiculoSeleccionado.PLACA?.trim()).then(setNeumaticosAsignados);
    // Mostrar en la tabla de disponibles SOLO los neumáticos del usuario autenticado (no filtrar por proyecto externo)
    Neumaticos().then(listaNeumaticos => {
      // Filtrar por USUARIO_SUPER si existe user
      const filtrados = listaNeumaticos.filter((n: any) => !user?.usuario || n.USUARIO_SUPER === user.usuario);
      setNeumaticos(listaNeumaticos);
      setNeumaticosFiltrados(filtrados); // Mostrar todos los disponibles del usuario
      animateTotalNeumaticos(0, filtrados.length);
    });
  };

  useEffect(() => {
    // Sólo disparar cuando tengamos un objeto de vehículo válido
    if (!vehiculo || !vehiculo.PLACA) return;

    // Llamamos al endpoint y actualizamos el estado
    obtenerUltimosMovimientosPorPlaca(vehiculo.PLACA)
      .then((arr) => {
        setNeumaticosAsignados(arr);
      })
      .catch((err) => {
        console.error("Error trayendo últimos movimientos de neumáticos:", err);
        setNeumaticosAsignados([]);
      });
  }, [vehiculo]);

  useEffect(() => {
    obtenerCantidadAutosDisponibles()
      .then(setAutosDisponiblesCount)
      .catch(console.error);
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 1. Agrega la función para refrescar asignados
  const refreshAsignados = async () => {
    if (vehiculo?.PLACA) {
      const asignados = await obtenerNeumaticosAsignadosPorPlaca(vehiculo.PLACA);
      const codigos: string[] = asignados.map((n: any) => n.CODIGO).filter(Boolean);
      const codigosUnicos = Array.from(new Set(codigos));
      const promesas = codigosUnicos.map(async (codigo) => {
        try {
          const movimientos = await obtenerUltimosMovimientosPorCodigo(codigo);
          if (Array.isArray(movimientos) && movimientos.length > 0) {
            return movimientos.sort((a, b) => new Date(b.FECHA_MOVIMIENTO).getTime() - new Date(a.FECHA_MOVIMIENTO).getTime())[0];
          }
          return null;
        } catch (e) {
          return null;
        }
      });
      const ultimosPorCodigo = (await Promise.all(promesas)).filter(Boolean);
      setNeumaticosAsignados(ultimosPorCodigo);
    }
  };

  // Refresca los datos del vehículo desde el backend
  const refreshVehiculo = async () => {
    if (vehiculo?.PLACA) {
      try {
        const vehiculoData = await buscarVehiculoPorPlaca(vehiculo.PLACA);
        if (vehiculoData) {
          setVehiculo(vehiculoData);
          // NO volver a animar el kilometraje aquí, para evitar mostrar un valor antiguo
          // animateKilometraje(0, vehiculoData.KILOMETRAJE); // Eliminado
        }
      } catch (e) {
        // Opcional: mostrar error
      }
    }
  };

  // Log para depuración ANTES del return, nunca dentro del JSX
  // console.log('Antes de abrir ModalAsignacionNeu:', {
  //   neumaticosAsignados,
  //   vehiculo,
  //   openModal,
  //   refreshAsignados
  // });

  // Filtrar para mostrar solo el último movimiento por posición
  const unicosPorPosicion = React.useMemo(() => {
    // 1. Filtra los que tengan posición definida
    const filtrados = neumaticosAsignados.filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0);
    // 2. Quedarse solo con el último movimiento por posición
    const porPosicion = Object.values(
      filtrados.reduce((acc: Record<string, typeof neumaticosAsignados[0]>, curr) => {
        const pos = curr.POSICION_NEU as string;
        if (!acc[pos] || ((curr.ID_MOVIMIENTO ?? 0) > (acc[pos].ID_MOVIMIENTO ?? 0))) {
          acc[pos] = curr;
        }
        return acc;
      }, {})
    );
    // 3. De los anteriores, quedarse solo con el último movimiento por código de neumático
    const porCodigo = Object.values(
      porPosicion.reduce((acc: Record<string, typeof porPosicion[0]>, curr) => {
        const cod = curr.CODIGO as string;
        if (!acc[cod] || ((curr.ID_MOVIMIENTO ?? 0) > (acc[cod].ID_MOVIMIENTO ?? 0))) {
          acc[cod] = curr;
        }
        return acc;
      }, {})
    );
    return porCodigo;
  }, [neumaticosAsignados]);

  // Doble filtrado: primero por posición (último movimiento por posición), luego por código (último movimiento por neumático)
  // Esto asegura que nunca se muestre el mismo neumático en dos posiciones, incluso si el backend trae duplicados.
  const unicosPorPosicionYCodigo = React.useMemo(() => {
    // 1. Filtrar los que tengan posición definida
    const filtrados = neumaticosAsignados.filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0);
    // 2. Quedarse con el último movimiento por posición
    const porPosicion = new Map<string, typeof neumaticosAsignados[0]>();
    for (const n of filtrados) {
      const pos = n.POSICION_NEU as string;
      if (!porPosicion.has(pos) || ((n.ID_MOVIMIENTO ?? 0) > (porPosicion.get(pos)?.ID_MOVIMIENTO ?? 0))) {
        porPosicion.set(pos, n);
      }
    }
    // 3. De los seleccionados por posición, quedarse solo con el último movimiento por código de neumático
    const porCodigo = new Map<string, typeof neumaticosAsignados[0]>();
    for (const n of porPosicion.values()) {
      const cod = n.CODIGO as string;
      if (!porCodigo.has(cod) || ((n.ID_MOVIMIENTO ?? 0) > (porCodigo.get(cod)?.ID_MOVIMIENTO ?? 0))) {
        porCodigo.set(cod, n);
      }
    }
    return Array.from(porCodigo.values());
  }, [neumaticosAsignados]);

  // Memo para filtrar por el último movimiento por código usando FECHA_MOVIMIENTO
  const neumaticosAsignadosUnicos = React.useMemo(() => {
    // Agrupar por código y quedarse con el de FECHA_MOVIMIENTO más reciente
    const porCodigo = new Map<string, typeof neumaticosAsignados[0]>();
    for (const n of neumaticosAsignados) {
      const cod = n.CODIGO as string;
      const fechaN = new Date(n.FECHA_MOVIMIENTO ?? '1970-01-01').getTime();
      const fechaPrev = new Date(porCodigo.get(cod)?.FECHA_MOVIMIENTO ?? '1970-01-01').getTime();
      if (!porCodigo.has(cod) || fechaN > fechaPrev) {
        porCodigo.set(cod, n);
      }
    }
    return Array.from(porCodigo.values());
  }, [neumaticosAsignados]);

  // Calcular el último kilometraje real desde los movimientos de neumáticos asignados
  const ultimoKilometroReal = React.useMemo(() => {
    const odometros = neumaticosAsignadosUnicos
      .map(n => {
        // Soporta string con comas, números, y distintos nombres de campo
        const raw = (n as any)['Odometro'] ?? (n as any)['ODOMETRO'] ?? (n as any)['KILOMETRO'] ?? (n as any)['KILOMETRAJE'];
        if (typeof raw === 'string') {
          // Elimina comas de miles y convierte a número
          return Number(raw.replace(/,/g, ''));
        }
        return Number(raw);
      })
      .filter(v => !isNaN(v) && v > 0);
    if (odometros.length > 0) {
      return Math.max(...odometros);
    }
    // Fallback: usar el del vehículo
    return Number(vehiculo?.KILOMETRO ?? vehiculo?.KILOMETRAJE ?? 0);
  }, [neumaticosAsignadosUnicos, vehiculo]);

  // Animar el kilometraje mostrado cuando cambie el valor real
  useEffect(() => {
    animateKilometraje(0, ultimoKilometroReal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoKilometroReal]);

  // Escuchar evento global para abrir el modal de inspección desde cualquier parte
  React.useEffect(() => {
    const handler = () => {
      setOpenInspeccionModal(true);
    };
    window.addEventListener('abrir-modal-inspeccion-interno', handler);
    return () => window.removeEventListener('abrir-modal-inspeccion-interno', handler);
  }, []);

  return (
    <Stack spacing={3}>
      {/* <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Asignación de Neumáticos</Typography>
        </Stack>
      </Stack> */}
      <CompaniesFilters
        onSearchChange={handleSearchChange}
        projectName={vehiculo?.PROYECTO || '—'}
        operationName={vehiculo?.OPERACION?.trim() || '—'}
        autosDisponiblesCount={autosDisponiblesCount}
        onVehiculoSeleccionado={handleVehiculoSeleccionado}
      />
      <Stack direction="row" spacing={2}>
        <Card sx={{
          flex: 0.8,
          p: 2,
          position: 'relative',
          maxHeight: '700px',
          overflow: 'auto'
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={3}>
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
                  {`Último Kilometro ${animatedKilometraje.toLocaleString()} km`}
                </Box>
                {/* Ícono de neumáticos */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={handleOpenModal}
                >
                  <img
                    src="/assets/tires-icon.png"
                    alt="Ícono de neumáticos"
                    style={{
                      width: '40px',
                      height: '40px',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: '0 0 0 0 rgba(0,0,0,0)',
                    }}
                    title="ASIGNAR NEUMÁTICO NUEVO"
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = '0 4px 16px 0 #00bcd4';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,0,0,0)';
                    }}
                  />
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => setOpenInspeccionModal(true)}
                >
                  <img
                    src="/assets/neu_inspeccion.png"
                    alt="Inspección neumáticos"
                    style={{
                      width: '40px',
                      height: '40px',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: '0 0 0 0 rgba(0,0,0,0)',
                    }}
                    title="INSPECCIÓN DE NEUMÁTICOS"
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = '0 4px 16px 0 #4caf50';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,0,0,0)';
                    }}
                  />
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onClick={() => setOpenMantenimientoModal(true)}
                >
                  <img
                    src="/assets/neu_matenimiento.png"
                    alt="Mantenimiento neumático"
                    style={{
                      width: '40px',
                      height: '40px',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: '0 0 0 0 rgba(0,0,0,0)',
                    }}
                    title="MANTENIMIENTO DE NEUMÁTICO"
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = '0 4px 16px 0 #ff9800';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 0 0 0 rgba(0,0,0,0)';
                    }}
                  />
                </Box>
                
              </>
            )}
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
            <DiagramaVehiculo
              layout="dashboard"
              neumaticosAsignados={neumaticosAsignadosUnicos
                .filter(n => typeof n.POSICION_NEU === 'string' && n.POSICION_NEU.length > 0 && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO')
                .map(n => ({
                  ...n,
                  POSICION: n.POSICION_NEU ?? '' // Garantiza que POSICION siempre sea string
                }))
              }
            />
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
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Fecha Movimiento</TableCell>
                  <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {neumaticosAsignadosUnicos.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO').length > 0 ? (
                  neumaticosAsignadosUnicos.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO').map((neumatico: any, index: number) => (
                    <TableRow key={neumatico.ID_MOVIMIENTO || `${neumatico.CODIGO}-${neumatico.POSICION_NEU}` }>
                      <TableCell align="center">{neumatico.POSICION_NEU}</TableCell>
                      <TableCell align="center">{neumatico.CODIGO}</TableCell>
                      <TableCell align="center">{neumatico.MARCA}</TableCell>
                      <TableCell align="center">{neumatico.MEDIDA}</TableCell>
                      <TableCell align="center">{neumatico.REMANENTE ?? 0}</TableCell>
                      <TableCell align="center">{
                        neumatico.FECHA_MOVIMIENTO
                          ? new Date(neumatico.FECHA_MOVIMIENTO).toLocaleString('es-PE', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                          : ''
                      }</TableCell>
                      <TableCell align="center">
                        {typeof neumatico.ESTADO === 'number' || (typeof neumatico.ESTADO === 'string' && neumatico.ESTADO !== '') ? (
                          <Box sx={{ position: 'relative', width: '120px' }}>
                            <LinearProgress
                              variant="determinate"
                              value={typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO}
                              sx={{
                                height: 20,
                                borderRadius: 5,
                                backgroundColor: '#eee',
                                boxShadow: '0 0 0 1.5px #222',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 39
                                      ? '#d32f2f'
                                      : (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 79
                                      ? '#ffa726'
                                      : '#2e7d32',
                                  borderRadius: 5,
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: 13,
                                letterSpacing: 0.5,
                                textShadow: '0 1px 2px rgba(255,255,255,0.15)'
                              }}
                            >
                              {typeof neumatico.ESTADO === 'string' ? neumatico.ESTADO.replace('%', '') : neumatico.ESTADO}%
                            </Typography>
                          </Box>
                        ) : ''}
                      </TableCell>
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
                {`Disponibles: ${neumaticosFiltrados.filter(n => n.TIPO_MOVIMIENTO === 'DISPONIBLE').length.toLocaleString()} Neumáticos`}
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
                  .filter(n => n.TIPO_MOVIMIENTO === 'DISPONIBLE')
                  .slice(page * 5, page * 5 + 5)
                  .map((neumatico) => (
                    <TableRow key={neumatico.CODIGO}>
                      <TableCell align="center">{neumatico.CODIGO}</TableCell>
                      <TableCell align="center">{neumatico.MARCA}</TableCell>
                      <TableCell align="center">{neumatico.DISEÑO}</TableCell>
                      <TableCell align="center">{neumatico.REMANENTE}</TableCell>
                      <TableCell align="center">{neumatico.MEDIDA}</TableCell>
                      <TableCell align="center">{neumatico.FECHA_FABRICACION_COD}</TableCell>
                      <TableCell align="center">
                        {typeof neumatico.ESTADO === 'number' || (typeof neumatico.ESTADO === 'string' && neumatico.ESTADO !== '') ? (
                          <Box sx={{ position: 'relative', width: '180px' }}>
                            <LinearProgress
                              variant="determinate"
                              value={typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO}
                              sx={{
                                height: 16,
                                borderRadius: 5,
                                backgroundColor: '#eee',
                                boxShadow: '0 0 0 1.5px #222',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 39
                                      ? '#d32f2f'
                                      : (typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO) < 79
                                      ? '#ffa726'
                                      : '#2e7d32',
                                  borderRadius: 5,
                                },
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000', // negro puro
                                fontWeight: 'bold',
                                fontSize: 13,
                                letterSpacing: 0.5,
                                textShadow: '0 1px 2px rgba(255,255,255,0.15)'
                              }}
                            >
                              {typeof neumatico.ESTADO === 'string' ? neumatico.ESTADO.replace('%', '') : neumatico.ESTADO}%
                            </Typography>
                          </Box>
                        ) : ''}
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
        onClose={handleCloseModal} // Solo cierra el modal, NO refresca datos ni kilometraje
        data={neumaticosFiltrados.map((neumatico) => ({
          ...neumatico,
          CODIGO: neumatico.CODIGO, // Ahora solo usar CODIGO
          DISEÑO: neumatico.DISEÑO ?? '', // Proveer un valor por defecto si falta
          FECHA_FABRICACION_COD: neumatico.FECHA_FABRICACION_COD ?? '', // Proveer un valor por defecto si falta
        }))}
        assignedNeumaticos={neumaticosAsignados}
        placa={vehiculo?.PLACA ?? ''}
        kilometro={ultimoKilometroReal}
        onAssignedUpdate={async () => {
          await refreshAsignados();
          setTimeout(async () => {
            await refreshVehiculo();
          }, 2500);
        }}
      />

      <ModalDeleteNeu
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onDelete={() => {
          setOpenDeleteModal(false);
        }}
      />
      <ModalInpeccionNeu
        open={openInspeccionModal}
        onClose={() => setOpenInspeccionModal(false)}
        placa={vehiculo?.PLACA ?? ''}
        // Cambia el filtro para usar POSICION_NEU en vez de POSICION
        neumaticosAsignados={neumaticosAsignados
          .filter((n): n is Neumatico & { POSICION_NEU: string } => typeof n.POSICION_NEU === 'string')
          .map(n => ({
            ...n,
            POSICION: n.POSICION_NEU ?? '',
            presion_aire: n.PRESION_AIRE ?? '',
            torque: n.TORQUE_APLICADO ?? '',
            ESTADO: n.ESTADO, // <-- AGREGADO
          }))
        }
        vehiculo={vehiculo ? {
          placa: vehiculo.PLACA,
          marca: vehiculo.MARCA,
          modelo: vehiculo.MODELO,
          anio: String(vehiculo.ANO),
          color: vehiculo.COLOR,
          proyecto: vehiculo.PROYECTO,
          operacion: vehiculo.OPERACION,
          kilometro: vehiculo.KILOMETRO
        } : undefined}
        // Nueva prop para selección de neumático
        onSeleccionarNeumatico={() => { }}
        onUpdateAsignados={refreshAsignados}
      />
      <ModalMantenimientoNeu
        open={openMantenimientoModal}
        onClose={() => {
          setOpenMantenimientoModal(false);
          refreshAsignados(); // Refresca asignados al cerrar
        }}
        placa={vehiculo?.PLACA ?? ''}
        neumaticosAsignados={neumaticosAsignados
          .filter((n): n is Neumatico & { POSICION_NEU: string } => typeof n.POSICION_NEU === 'string')
          .map(n => ({
            ...n,
            POSICION: n.POSICION_NEU ?? '',
            presion_aire: n.PRESION_AIRE ?? '',
            torque: n.TORQUE_APLICADO ?? '',
            ESTADO: n.ESTADO, // <-- AGREGADO
          }))
        }
        vehiculo={vehiculo ? {
          placa: vehiculo.PLACA,
          marca: vehiculo.MARCA,
          modelo: vehiculo.MODELO,
          anio: String(vehiculo.ANO),
          color: vehiculo.COLOR,
          proyecto: vehiculo.PROYECTO,
          operacion: vehiculo.OPERACION,
          kilometro: vehiculo.KILOMETRO,
        } : undefined}
        onSeleccionarNeumatico={() => { }}
      />
    </Stack>
  );
}
