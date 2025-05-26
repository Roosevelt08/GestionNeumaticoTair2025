"use client";

import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface CompaniesFiltersProps {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  projectName: string;             // ← Nuevo prop para el nombre del proyecto
  operationName?: string;          // ← Prop opcional para el nombre de la operación
}

export function CompaniesFilters({
  onSearchChange,
  projectName,                     // ← Lo recibimos aquí
  operationName,                   // ← Y aquí
}: CompaniesFiltersProps): React.JSX.Element {
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
        {operationName && (
          <Typography variant="body2" sx={{ fontWeight: 'medium'}}>
            {operationName}
          </Typography>
        )}
        <Box
          component="img"
          src="/assets/vehiculo.png"
          alt="Vehículo"
          sx={{
            width: 100,
            height: 100,
          }}
        />
      </Stack>
    </Card>
  );
}
