
const INCIDENT_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://192.168.100.83:5008';

export interface CrearIncidentePayload {
    idUsuario: number;
    idZona: number;
    tipoIncidente: string;
    descripcion?: string;
}

export interface IncidenteCreado {
    idIncidente: number;
    idUsuario: number;
    idZona: number;
    tipoIncidente: string;
    estado: string;
    fechaReporte: string;
    mensaje: string;
}

/**
 * Llama a POST /api/incidents para registrar un nuevo incidente.
 * Lanza un Error si la respuesta no es 2xx.
 */
export async function crearIncidente(
    payload: CrearIncidentePayload,
    token: string
): Promise<IncidenteCreado> {
    const response = await fetch(`${INCIDENT_URL}/api/incidents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.mensaje ?? `Error ${response.status} al crear el incidente`);
    }

    return response.json();
}
