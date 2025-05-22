import axios from "axios";

// Obtener la lista de neumáticos
export const Neumaticos = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos`);
  return response.data;
};

// Subir el padrón de neumáticos desde Excel
export const cargarPadronNeumatico = async (archivoExcel) => {
  const formData = new FormData();
  formData.append("archivo", archivoExcel);

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
};

// Buscar vehículo por placa
export const buscarVehiculoPorPlaca = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculo/${placa}`);
    return response.data; // Retorna los datos del vehículo
  } catch (error) {
    console.error("Error al buscar el vehículo por placa:", error);
    throw error; // Lanza el error para manejarlo en el frontend
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

// Asignar neumático a una posición de un vehículo
export const asignarNeumatico = async (payload) => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/asignar-neumatico`, payload);
    return response.data;
  } catch (error) {
    console.error('Error en asignarNeumatico:', error);
    throw error;
  }
};
