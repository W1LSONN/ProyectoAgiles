import { useEffect, useState, useCallback } from 'react';
import { signalRService, type AlertaIncidente } from '../services/signalrService';

export function useSignalR(grupo: string) {
    const [alertas, setAlertas] = useState<AlertaIncidente[]>([]);
    const [conectado, setConectado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const agregarAlerta = useCallback((alerta: AlertaIncidente) => {
        setAlertas(prev => [alerta, ...prev]); // nuevas alertas al inicio
    }, []);

    useEffect(() => {
        let cancelado = false;

        const iniciar = async () => {
            try {
                await signalRService.start();
                if (cancelado) return;

                const conn = signalRService.getConnection()!;

                // Escuchar alertas del servidor
                conn.on('RecibirAlertaIncidente', (data: AlertaIncidente) => {
                    if (!cancelado) agregarAlerta(data);
                });

                // Unirse al grupo (ej: "Guardias" o "Admins")
                await signalRService.joinGroup(grupo);
                setConectado(true);

                // Manejar reconexión
                conn.onreconnected(async () => {
                    await signalRService.joinGroup(grupo);
                    setConectado(true);
                });
                conn.onreconnecting(() => setConectado(false));
                conn.onclose(() => setConectado(false));

            } catch (e) {
                // Si el servicio no está disponible, simplemente quedamos en estado "desconectado".
                // El pill de conexión ya muestra el estado rojo — no necesitamos un banner de error.
                console.warn('SignalR: No se pudo conectar al NotificationService (puerto 5009). ¿Está corriendo?');
                if (!cancelado) setConectado(false);
            }
        };

        iniciar();

        return () => {
            cancelado = true;
            signalRService.leaveGroup(grupo);
        };
    }, [grupo]);

    return { alertas, conectado, error };
}
