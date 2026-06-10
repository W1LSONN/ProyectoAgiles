// URL base de tu microservicio de Usuarios/Autenticación.
// Usamos VITE_AUTH_URL que es la misma que usa tu Login (por defecto puerto 5007 con tu IP)
const USER_URL = import.meta.env.VITE_AUTH_URL ?? 'http://192.168.100.83:5007';

export interface UsuarioDetalle {
    idUsuario: number;
    nombre: string;
    facultad: string;
}

/**
 * Obtiene el nombre y facultad de un usuario por su ID
 */
export async function obtenerDetallesUsuario(idUsuario: number): Promise<UsuarioDetalle> {
    try {
        const response = await fetch(`${USER_URL}/api/usuarios/${idUsuario}`);
        if (!response.ok) {
            throw new Error('No se pudo obtener el usuario');
        }
        return await response.json();
    } catch (error) {
        // Fallback: Si el servidor falla o no está encendido, mostramos datos genéricos
        return {
            idUsuario,
            nombre: `Usuario Mock #${idUsuario}`,
            facultad: 'Facultad / Carrera no definida'
        };
    }
}