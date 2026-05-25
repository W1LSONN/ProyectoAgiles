// URL del GrupoService desde las variables de entorno
const GROUP_URL = import.meta.env.VITE_GROUP_URL ?? 'http://localhost:5008';

export interface GrupoMiembro {
    idUsuario: number;
    nombre: string;
    correo: string;
}

export interface Grupo {
    idGrupo: number;
    nombre: string;
    descripcion: string;
    miembros: GrupoMiembro[];
}

export interface CrearGrupoPayload {
    nombre: string;
    descripcion: string;
}

function buildHeaders(token: string) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

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

export async function unirseGrupo(idGrupo: number, token: string): Promise<Grupo> {
    const response = await fetch(`${GROUP_URL}/api/grupos/${idGrupo}/unirse`, {
        method: 'POST',
        headers: buildHeaders(token),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al unirse al grupo`);
    }

    return response.json();
}

export async function salirGrupo(idGrupo: number, token: string): Promise<Grupo> {
    const response = await fetch(`${GROUP_URL}/api/grupos/${idGrupo}/salir`, {
        method: 'POST',
        headers: buildHeaders(token),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al salir del grupo`);
    }

    return response.json();
}
