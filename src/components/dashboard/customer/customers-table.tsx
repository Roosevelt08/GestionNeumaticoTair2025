'use client';

import * as React from 'react';
import {
  Card, Table, TableBody, TableCell, TableHead, TablePagination,
  TableRow, Box, Divider, Typography, Checkbox, Stack, LinearProgress
} from '@mui/material';

import { useSelection } from '@/hooks/use-selection';

export interface Customer {
  CODIGO: number;
  MARCA: string;
  MEDIDA: string;
  DISEÑO: string;
  REMANENTE: number;
  PR: number;
  CARGA: number;
  VELOCIDAD: string;
  RQ: number;
  OC: number;
  PROYECTO: string;
  COSTO: number;
  PROVEEDOR: string;
  FECHA: string;
  USUARIO_SUPER: string;
  ESTADO_ASIGNACION: string;
  ESTADO: string;
}

interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Customer[];
  rowsPerPage?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CustomersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onPageChange = () => {},
  onRowsPerPageChange,
}: CustomersTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => {
    return rows.map((customer) => customer.CODIGO.toString());
  }, [rows]);

  const { selectAll, deselectAll, selectOne, deselectOne, selected } = useSelection(rowIds);

  const selectedSome = (selected?.size ?? 0) > 0 && (selected?.size ?? 0) < rows.length;
  const selectedAll = rows.length > 0 && selected?.size === rows.length;

  return (
    <Card sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (event.target.checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                />
              </TableCell>
              <TableCell><Typography fontWeight="bold">Código</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Marca</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Medida</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Diseño</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Remanente</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">PR</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Carga</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">RQ</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">OC</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proyecto</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proveedor</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Fecha Fabricación</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Situación</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Estado</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isSelected = selected?.has(row.CODIGO.toString());

              return (
                <TableRow hover key={row.CODIGO} selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          selectOne(row.CODIGO.toString());
                        } else {
                          deselectOne(row.CODIGO.toString());
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{row.CODIGO}</TableCell>
                  <TableCell>{row.MARCA}</TableCell>
                  <TableCell>{row.MEDIDA}</TableCell>
                  <TableCell>{row.DISEÑO}</TableCell>
                  <TableCell>{row.REMANENTE}</TableCell>
                  <TableCell>{row.PR}</TableCell>
                  <TableCell>{row.CARGA}</TableCell>
                  <TableCell>{row.RQ}</TableCell>
                  <TableCell>{row.OC}</TableCell>
                  <TableCell>{row.PROYECTO}</TableCell>
                  <TableCell>{row.PROVEEDOR}</TableCell>
                  <TableCell>{row.FECHA}</TableCell>
                  <TableCell>{row.ESTADO_ASIGNACION}</TableCell>
                  <TableCell>
                    <Box sx={{ position: 'relative', minWidth: 60, width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={parseInt(row.ESTADO, 10)}
                        sx={{
                          height: 20,
                          borderRadius: 5,
                          [`& .MuiLinearProgress-bar`]: {
                            backgroundColor: parseInt(row.ESTADO, 10) === 100 ? 'green' : 'orange',
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
                        {`${row.ESTADO}%`}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <Box sx={{ px: 2 }}>
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 30]}
        />
      </Box>
    </Card>
  );
}
