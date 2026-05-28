export interface Camera {
  idCamara?: number;
  nombre: string;
  latitud: number;
  longitud: number;
  urlStream?: string;
  estado?: string;
  idZona?: number;
  nombreZona?: string;
}

export interface CameraFormData {
  nombre: string;
  latitud: number;
  longitud: number;
  idZona: number;
}

const API_BASE_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';
const API_CAMERAS_ENDPOINT = `${API_BASE_URL}/api/camaras`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.error || data?.mensaje || data?.message || response.statusText;
    throw new Error(message || `HTTP ${response.status}`);
  }
  return data as T;
};

export const getCameras = async (): Promise<Camera[]> => {
  const response = await fetch(API_CAMERAS_ENDPOINT, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return await handleResponse<Camera[]>(response);
};

export const createCamera = async (data: CameraFormData): Promise<Camera> => {
  const response = await fetch(API_CAMERAS_ENDPOINT, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return await handleResponse<Camera>(response);
};

export const deleteCamera = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_CAMERAS_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse<null>(response);
  return true;
};

export const updateCamera = async (id: number, data: CameraFormData): Promise<Camera> => {
  const response = await fetch(`${API_CAMERAS_ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return await handleResponse<Camera>(response);
};

export const getCamerasByZona = async (zonaId: string): Promise<Camera[]> => {
  const response = await fetch(`${API_CAMERAS_ENDPOINT}/zona/${encodeURIComponent(zonaId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return await handleResponse<Camera[]>(response);
};
