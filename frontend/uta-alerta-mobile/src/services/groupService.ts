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

// ── SOLICITUDES DE GRUPO ────────────────────────────────────────────────

export interface SolicitudGrupo {
    idSolicitud: number;
    idGrupo: number;
    nombreGrupo: string;
    descripcionGrupo?: string;
    idUsuarioSolicitante: number;
    idCreador?: number;
    estado: 'Pendiente' | 'Aceptada' | 'Rechazada';
    fechaSolicitud: string;
}

/**
 * Envía una solicitud de unión a un grupo de confianza.
 * El solicitante invita al destinatario a su grupo.
 */
export async function enviarSolicitud(
    idGrupo: number,
    idUsuarioSolicitante: number,
    idUsuarioDestinatario: number,
    token: string
): Promise<{ idSolicitud: number; mensaje: string }> {
    const response = await fetch(`${GROUP_URL}/api/solicitudes`, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ idGrupo, idUsuarioSolicitante, idUsuarioDestinatario }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al enviar la solicitud`);
    }
    return response.json();
}

/**
 * Obtiene las solicitudes PENDIENTES que recibió el usuario.
 */
export async function obtenerSolicitudesPendientes(
    idUsuario: number,
    token: string
): Promise<SolicitudGrupo[]> {
    const response = await fetch(`${GROUP_URL}/api/solicitudes/pendientes/${idUsuario}`, {
        method: 'GET',
        headers: buildHeaders(token),
    });
    if (!response.ok) return [];
    return response.json();
}

/**
 * Contar solicitudes pendientes (para el badge).
 */
export async function contarSolicitudesPendientes(
    idUsuario: number,
    token: string
): Promise<number> {
    try {
        const response = await fetch(`${GROUP_URL}/api/solicitudes/pendientes/${idUsuario}/count`, {
            method: 'GET',
            headers: buildHeaders(token),
        });
        if (!response.ok) return 0;
        const data = await response.json();
        return data.count ?? 0;
    } catch {
        return 0;
    }
}

/**
 * Responder a una solicitud: Aceptada o Rechazada.
 */
export async function responderSolicitud(
    idSolicitud: number,
    estado: 'Aceptada' | 'Rechazada',
    token: string
): Promise<{ mensaje: string }> {
    const response = await fetch(`${GROUP_URL}/api/solicitudes/${idSolicitud}/responder`, {
        method: 'PUT',
        headers: buildHeaders(token),
        body: JSON.stringify({ estado }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al responder`);
    }
    return response.json();
}

/**
 * Obtiene las solicitudes PENDIENTES enviadas por el usuario.
 */
export async function obtenerSolicitudesEnviadas(
    idUsuario: number,
    token: string
): Promise<SolicitudGrupo[]> {
    const response = await fetch(`${GROUP_URL}/api/solicitudes/enviadas/${idUsuario}`, {
        method: 'GET',
        headers: buildHeaders(token),
    });
    if (!response.ok) return [];
    return response.json();
}

