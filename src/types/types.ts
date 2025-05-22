export interface Neumatico {
  ID: string;
  CODIGO: string; // Código del neumático
  CODIGO_NEU?: string; // Código alternativo del neumático (opcional)
  MARCA: string; // Marca del neumático
  DISEÑO?: string; // Diseño del neumático (opcional)
  REMANENTE: string; // Porcentaje de vida útil restante
  MEDIDA: string; // Medida del neumático
  FECHA?: string; // Fecha de asignación (opcional)
  ESTADO: string; // Estado del neumático
  POSICION?: string; // Posición del neumático en el vehículo (opcional)
  PROYECTO?: string; // Agregar esta propiedad
  ESTADO_ASIGNACION?: string;
  FECHA_ASIGNADO?: string;
}