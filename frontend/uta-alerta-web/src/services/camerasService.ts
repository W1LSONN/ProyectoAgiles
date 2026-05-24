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

// --- Configuración de Mocks (Datos Simulados) ---
const USE_MOCKS = true; // Cambiar a false cuando el backend esté listo

let mockCameras: Camera[] = [
  { idCamera: 1, nombre: 'Cámara Principal', ubicacion: 'Entrada Norte', zona: 'Zona 1', estado: 'activa' },
  { idCamera: 2, nombre: 'Cámara Pasillo', ubicacion: 'Piso 2', zona: 'Zona 2', estado: 'activa' },
  { idCamera: 3, nombre: 'Cámara Comedor', ubicacion: 'Patio Central', zona: 'Zona 1', estado: 'inactiva' }
];
let nextMockId = 4;

// Función auxiliar para simular el tiempo de respuesta de la red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// -------------------------------------------------

/**
 * Obtener todas las cámaras
 * Backend debe implementar: GET /api/cameras
 */
export const getCameras = async (): Promise<Camera[]> => {
  if (USE_MOCKS) {
    console.log('MOCK: Obteniendo cámaras...');
    await delay(500);
    return [...mockCameras];
  }

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
  if (USE_MOCKS) {
    console.log('MOCK: Creando cámara...', data);
    await delay(500);
    const newCamera: Camera = {
      idCamera: nextMockId++,
      ...data,
      estado: 'activa',
      fechaCreacion: new Date().toISOString()
    };
    mockCameras.push(newCamera);
    return newCamera;
  }

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
  if (USE_MOCKS) {
    console.log(`MOCK: Eliminando cámara ${id}...`);
    await delay(500);
    mockCameras = mockCameras.filter(c => c.idCamera !== id);
    return true;
  }

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
  if (USE_MOCKS) {
    console.log(`MOCK: Actualizando cámara ${id}...`, data);
    await delay(500);
    const index = mockCameras.findIndex(c => c.idCamera === id);
    if (index !== -1) {
      mockCameras[index] = { ...mockCameras[index], ...data };
      return mockCameras[index];
    }
    throw new Error('Cámara no encontrada en mocks');
  }

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
  if (USE_MOCKS) {
    console.log(`MOCK: Obteniendo cámaras de la zona ${zonaId}...`);
    await delay(500);
    return mockCameras.filter(c => c.zona === zonaId);
  }

  try {
    const response = await fetch(`${API_CAMERAS_ENDPOINT}/zona/${zonaId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al obtener cámaras por zona:', error);
    return [];
  }
};
