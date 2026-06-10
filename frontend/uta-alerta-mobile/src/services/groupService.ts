// URL del GrupoService desde las variables de entorno
const GROUP_URL = import.meta.env.VITE_GROUP_URL ?? import.meta.env.VITE_NOTIFICATION_URL ?? 'http://192.168.100.83:5009';

export interface GrupoMiembro {
    idUsuarioGrupo: number;
    idUsuario: number;
    fechaUnion: string;
}

export interface Grupo {
    idGrupo: number;
    nombre: string;
    descripcion: string;
    idCreador: number;
    fechaCreacion: string;
    cantidadMiembros?: number;
    miembros?: GrupoMiembro[];
}

export interface CrearGrupoPayload {
    nombre: string;
    descripcion: string;
    idCreador: number;
}

export interface MiembroRequestDto {
    idUsuario: number;
}

function buildHeaders(token: string) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Obtiene la lista de todos los grupos de confianza.
 */
export async function obtenerGrupos(token: string): Promise<Grupo[]> {
    const response = await fetch(`${GROUP_URL}/api/grupos`, {
        method: 'GET',
        headers: buildHeaders(token),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al obtener los grupos`);
    }

    return response.json();
}

/**
 * Crea un nuevo grupo de confianza.
 * @param payload - Debe incluir nombre, descripción e idCreador (usuario actual)
 * @param token - Token de autenticación
 */
export async function crearGrupo(payload: CrearGrupoPayload, token: string): Promise<Grupo> {
    const response = await fetch(`${GROUP_URL}/api/grupos`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al crear el grupo`);
    }

    return response.json();
}

/**
 * Agrega un usuario como miembro a un grupo.
 * @param idGrupo - ID del grupo
 * @param idUsuario - ID del usuario a agregar
 * @param token - Token de autenticación
 */
export async function unirseGrupo(
    idGrupo: number,
    idUsuario: number,
    token: string
): Promise<{ message: string; idUsuarioGrupo: number }> {
    const response = await fetch(`${GROUP_URL}/api/grupos/${idGrupo}/miembros`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ idUsuario }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al unirse al grupo`);
    }

    return response.json();
}

/**
 * Remueve un usuario como miembro de un grupo (salir del grupo).
 * @param idGrupo - ID del grupo
 * @param idUsuario - ID del usuario a remover
 * @param token - Token de autenticación
 */
export async function salirGrupo(
    idGrupo: number,
    idUsuario: number,
    token: string
): Promise<{ mensaje: string }> {
    const response = await fetch(`${GROUP_URL}/api/grupos/${idGrupo}/miembros/${idUsuario}`, {
        method: 'DELETE',
        headers: buildHeaders(token),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al salir del grupo`);
    }

    return response.json();
}

/**
 * Obtiene los detalles de un grupo específico con sus miembros.
 * @param idGrupo - ID del grupo
 * @param token - Token de autenticación
 */
export async function obtenerGrupoDetalle(idGrupo: number, token: string): Promise<Grupo> {
    const response = await fetch(`${GROUP_URL}/api/grupos/${idGrupo}`, {
        method: 'GET',
        headers: buildHeaders(token),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al obtener el grupo`);
    }

    return response.json();
}
