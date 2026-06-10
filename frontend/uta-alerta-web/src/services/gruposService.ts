export interface MiembroGrupo {
  idUsuarioGrupo: number;
  idUsuario: number;
  fechaUnion: string;
}

export interface GrupoConfianza {
  idGrupo: number;
  nombre: string;
  descripcion: string;
  idCreador: number;
  fechaCreacion: string;
  cantidadMiembros: number;
  miembros: MiembroGrupo[];
}

const API_BASE_URL = import.meta.env.VITE_NOTIFICATIONS_URL ?? 'http://localhost:5009';
const API_GRUPOS_ENDPOINT = `${API_BASE_URL}/api/grupos`;

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

export const getGrupos = async (): Promise<GrupoConfianza[]> => {
  const response = await fetch(API_GRUPOS_ENDPOINT, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return await handleResponse<GrupoConfianza[]>(response);
};

export const deleteGrupo = async (id: number): Promise<boolean> => {
  const response = await fetch(`${API_GRUPOS_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await handleResponse<null>(response);
  return true;
};
