import { useEffect, useState, useCallback } from 'react';
import { signalRService, type AlertaIncidente } from '../services/signalrService';
import * as signalR from '@microsoft/signalr'; // Importar para validar estados

const INCIDENTS_URL = import.meta.env.VITE_INCIDENT_URL ?? 'http://localhost:5008';

const mapIncidente = (incidente: any): AlertaIncidente => {
    const rawIdIncidente = incidente.idIncidente ?? incidente.IdIncidente ?? incidente.id ?? incidente.ID;
    const idIncidente = Number(rawIdIncidente);

    const rol = incidente.rol ?? incidente.Rol;
    const carrera = incidente.carrera ?? incidente.Carrera;
    const facultad = incidente.facultad ?? incidente.Facultad ?? carrera ?? rol ?? '—';
    const rawZona = incidente.zona ?? incidente.Zona;
    const rawIdZona = incidente.idZona ?? incidente.IdZona;

    return {
        idIncidente: Number.isNaN(idIncidente) ? Date.now() : idIncidente,
        nombreUsuario: incidente.nombreUsuario ?? incidente.NombreUsuario ?? `Usuario #${incidente.idUsuario ?? incidente.IdUsuario ?? '?'}`,
        facultad,
        zona: rawIdZona ? `Zona ${rawIdZona}` : (rawZona ?? '—'),
        tipoIncidente: incidente.tipoIncidente ?? incidente.TipoIncidente ?? 'Incidente',
        mensaje: incidente.mensaje ?? incidente.Mensaje ?? incidente.descripcion ?? incidente.Descripcion ?? incidente.tipoIncidente ?? incidente.TipoIncidente ?? 'Incidente activo',
        fechaReporte: incidente.fechaReporte ?? incidente.FechaReporte ?? new Date().toISOString(),
        estado: incidente.estado ?? incidente.Estado ?? 'Activo',
        guardiaAsignado: incidente.guardiaAsignado ?? incidente.GuardiaAsignado,
        rol,
        carrera
    };
};

export function useSignalR(grupo: string) {
    const [alertas, setAlertas] = useState<AlertaIncidente[]>([]);
    const [conectado, setConectado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const agregarAlerta = useCallback((alerta: AlertaIncidente) => {
        setAlertas(prev => {
            const sinDuplicados = prev.filter(item => item.idIncidente !== alerta.idIncidente);
            return [alerta, ...sinDuplicados];
        });
    }, []);

    const cargarAlertasIniciales = useCallback(async (cancelado: () => boolean) => {
        try {
            const response = await fetch(`${INCIDENTS_URL}/api/incidents?estado=Activo`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data: any[] = await response.json();
            const alertasActivas = data
                .map(mapIncidente)
                .filter(alerta => (alerta.estado ?? '').toLowerCase() === 'activo');

            if (!cancelado()) {
                setAlertas(prev => {
                    const combinadas = [...alertasActivas, ...prev];
                    return combinadas.reduce<AlertaIncidente[]>((acumuladas, alerta) => {
                        const existente = acumuladas.findIndex(item => item.idIncidente === alerta.idIncidente);

                        if (existente >= 0) {
                            acumuladas[existente] = { ...acumuladas[existente], ...alerta };
                            return acumuladas;
                        }

                        acumuladas.push(alerta);
                        return acumuladas;
                    }, []);
                });
            }
        } catch (e) {
            console.warn('SignalR: no se pudieron cargar los incidentes activos al iniciar.', e);
        }
    }, []);

    useEffect(() => {
        let cancelado = false;

        const iniciar = async () => {
            try {
                setError(null);
                await signalRService.start();
                if (cancelado) return;

                const conn = signalRService.getConnection()!;
                const manejarAlertaIncidente = (data: AlertaIncidente) => {
                    if (!cancelado) agregarAlerta(data);
                };

                // Escuchar alertas
                conn.on('RecibirAlertaIncidente', manejarAlertaIncidente);

                // CORRECCIÓN: Solo unirse e iluminar el badge si la conexión fue exitosa
                if (conn.state === signalR.HubConnectionState.Connected) {
                    await signalRService.joinGroup(grupo);
                    if (!cancelado) setConectado(true);
                }

                await cargarAlertasIniciales(() => cancelado);

                // Manejar reconexión
                conn.onreconnected(async () => {
                    await signalRService.joinGroup(grupo);
                    if (!cancelado) setConectado(true);
                });

                conn.onreconnecting(() => !cancelado && setConectado(false));
                conn.onclose(() => !cancelado && setConectado(false));

            } catch (e) {
                console.warn('SignalR: Error en la conexión.', e);
                if (!cancelado) {
                    setConectado(false);
                    setError('No se pudo conectar con el canal en tiempo real.');
                }
            }
        };

        iniciar();

        return () => {
            cancelado = true;
            // La validación interna en el service evitará el error de "Cannot send data..."
            const conn = signalRService.getConnection();
            if (conn) {
                conn.off('RecibirAlertaIncidente');
            }
            signalRService.leaveGroup(grupo);
        };
    }, [grupo, agregarAlerta, cargarAlertasIniciales]);

    return { alertas, conectado, error };
}