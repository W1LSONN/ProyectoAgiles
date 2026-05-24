// Tipos para Cámaras
export interface Camera {
  idCamera?: number;
  nombre: string;
  ubicacion: string;
  zona: string;
  estado?: 'activa' | 'inactiva' | 'mantenimiento';
  fechaCreacion?: string;
}

export interface CameraFormData {
  nombre: string;
  ubicacion: string;
  zona: string;
}

// URL base del API (será proporcionada por el backend)
const API_BASE_URL = 'http://localhost:5010'; // Ajustar puerto según backend
const API_CAMERAS_ENDPOINT = `${API_BASE_URL}/api/cameras`;

/**
 * Obtener todas las cámaras
 * Backend debe implementar: GET /api/cameras
 */
export const getCameras = async (): Promise<Camera[]> => {
  try {
    const response = await fetch(API_CAMERAS_ENDPOINT);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al obtener cámaras:', error);
    return [];
  }
};

/**
 * Crear una nueva cámara
 * Backend debe implementar: POST /api/cameras
 * Body: { nombre: string, ubicacion: string, zona: string }
 */
export const createCamera = async (data: CameraFormData): Promise<Camera | null> => {
  try {
    const response = await fetch(API_CAMERAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al crear cámara:', error);
    throw error;
  }
};

/**
 * Eliminar una cámara
 * Backend debe implementar: DELETE /api/cameras/{id}
 */
export const deleteCamera = async (id: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CAMERAS_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error al eliminar cámara:', error);
    throw error;
  }
};

/**
 * Actualizar una cámara
 * Backend debe implementar: PUT /api/cameras/{id}
 */
export const updateCamera = async (id: number, data: CameraFormData): Promise<Camera | null> => {
  try {
    const response = await fetch(`${API_CAMERAS_ENDPOINT}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar cámara:', error);
    throw error;
  }
};

/**
 * Obtener cámaras por zona
 * Backend debe implementar: GET /api/cameras/zona/{zonaId}
 */
export const getCamerasByZona = async (zonaId: string): Promise<Camera[]> => {
  try {
    const response = await fetch(`${API_CAMERAS_ENDPOINT}/zona/${zonaId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al obtener cámaras por zona:', error);
    return [];
  }
};
