import { useEffect, useState, useCallback } from 'react';
import { signalRService, type AlertaIncidente } from '../services/signalrService';
import * as signalR from '@microsoft/signalr'; // Importar para validar estados

export function useSignalR(grupo: string) {
    const [alertas, setAlertas] = useState<AlertaIncidente[]>([]);
    const [conectado, setConectado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const agregarAlerta = useCallback((alerta: AlertaIncidente) => {
        setAlertas(prev => [alerta, ...prev]);
    }, []);

    useEffect(() => {
        let cancelado = false;

        const iniciar = async () => {
            try {
                setError(null);
                await signalRService.start();
                if (cancelado) return;

                const conn = signalRService.getConnection()!;

                // Escuchar alertas
                conn.on('RecibirAlertaIncidente', (data: AlertaIncidente) => {
                    if (!cancelado) agregarAlerta(data);
                });

                // CORRECCIÓN: Solo unirse e iluminar el badge si la conexión fue exitosa
                if (conn.state === signalR.HubConnectionState.Connected) {
                    await signalRService.joinGroup(grupo);
                    if (!cancelado) setConectado(true);
                }

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
            signalRService.leaveGroup(grupo);
        };
    }, [grupo, agregarAlerta]);

    return { alertas, conectado, error };
}