"use client";

import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ModalTodasPlacas from './modal-todasPlacas';

interface CompaniesFiltersProps {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  projectName: string;
  operationName?: string;
  autosDisponiblesCount?: number;
}

export function CompaniesFilters({
  onSearchChange,
  projectName,
  operationName,
  autosDisponiblesCount,
}: CompaniesFiltersProps): React.JSX.Element {
  const [openModal, setOpenModal] = React.useState(false);
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setOpenModal(true);
    }
  };
  const handleCloseModal = () => setOpenModal(false);
  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        {/* Input de búsqueda */}
        <OutlinedInput
          onChange={onSearchChange}
          fullWidth
          placeholder="Buscar por Placa"
          startAdornment={
            <InputAdornment position="start">
              <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
            </InputAdornment>
          }
          sx={{ maxWidth: '400px' }}
        />
        <FormControlLabel
          control={<Checkbox onChange={handleCheckboxChange} />}
          label="Todas las Placas"
        />
        <Box
          component="img"
          src="/assets/proyecto.png"
          alt="Proyecto"
          sx={{
            width: 70,
            height: 70,
          }}
        />
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {projectName}
        </Typography>
        <Box
          component="img"
          src="/assets/operacion.png"
          alt="Operación"
          sx={{
            width: 70,
            height: 70,
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 'medium'}}>
          {operationName}
        </Typography>
        <Box
          component="img"
          src="/assets/vehiculo.png"
          alt="Vehículo"
          sx={{
            width: 100,
            height: 100,
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 'medium'}}>
          {autosDisponiblesCount} AUTOS DISPONIBLES
        </Typography>
      </Stack>
      {/* Modal para todas las placas */}
      <ModalTodasPlacas open={openModal} onClose={handleCloseModal} />
    </Card>
  );
}

export default CompaniesFilters;
