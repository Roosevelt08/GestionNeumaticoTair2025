import axios from "axios";

// Obtener la lista de neumáticos
export const Neumaticos = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos`, { withCredentials: true });
  return response.data;
};

// Subir el padrón de neumáticos desde Excel
export const cargarPadronNeumatico = async (archivoExcel) => {
  const formData = new FormData();
  formData.append("archivo", archivoExcel);

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/po-padron/cargar-padron`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    // Si el backend responde con error 500 o 400, devolver el mensaje de error
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error + (error.response.data.detalle ? `: ${error.response.data.detalle}` : ''));
    }
    throw error;
  }
};

// Buscar vehículo por placa
export const buscarVehiculoPorPlaca = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculo/${placa}`, { withCredentials: true });
    return response.data; // Retorna los datos del vehículo
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Vehículo no encontrado
    }
    console.error("Error al buscar el vehículo por placa:", error);
    throw error; // Lanza el error para manejarlo en el frontend
  }
};

// Buscar vehículo por placa en toda la empresa (sin filtro de usuario)
export const buscarVehiculoPorPlacaEmpresa = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculo/buscar-todas/${placa}`, { withCredentials: true });
    return response.data; // Retorna los datos del vehículo
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Vehículo no encontrado
    }
    console.error("Error al buscar el vehículo por placa (empresa):", error);
    throw error;
  }
};

// Obtener la lista de neumáticos asignados por placa
export const obtenerNeumaticosAsignadosPorPlaca = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-asignados/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerNeumaticosAsignadosPorPlaca:', error);
    throw error;
  }
};

// Asignar neumático a una posición de un vehículo (versión fetch eliminada del modal)
export const asignarNeumatico = async ({ Placa, Posicion, CodigoNeumatico, Odometro, Observacion }) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/asignar-neumatico`,
      {
        Placa,
        Posicion,
        CodigoNeumatico,
        Odometro,
        Observacion,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error en asignarNeumatico:', error);
    throw error;
  }
};

// Obtener la cantidad total de neumáticos
export const obtenerCantidadNeumaticos = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de neumáticos disponibles
export const obtenerCantidadNeumaticosDisponibles = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos/disponibles/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de neumáticos asignados
export const obtenerCantidadNeumaticosAsignados = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos/asignados/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de autos (placas) disponibles para el usuario autenticado
export const obtenerCantidadAutosDisponibles = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculo/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};
