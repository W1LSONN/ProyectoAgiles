import * as signalR from '@microsoft/signalr';

const HUB_URL = import.meta.env.VITE_NOTIFICATION_URL 
  ? `${import.meta.env.VITE_NOTIFICATION_URL}/hubs/incident`
  : (import.meta.env.VITE_NOTIFICATIONS_URL 
      ? `${import.meta.env.VITE_NOTIFICATIONS_URL}/hubs/incident`
      : 'http://localhost:5009/hubs/incident');

export interface AlertaIncidente {
    idIncidente: number;
    nombreUsuario: string;
    facultad: string;
    zona: string;
    tipoIncidente: string;
    mensaje: string;
    fechaReporte: string;
    estado?: string;
    guardiaAsignado?: string;
    rol?: string;
    carrera?: string;
    latitud?: number;
    longitud?: number;
}

export interface ReporteGuardia {
    idReporte: number;
    numeroReporte: string;
    nombreGuardia: string;
    titulo: string;
    descripcion: string;
    tipoReporte: string;
    prioridad: string;
    zona: string;
    horaIncidente: string;
    fechaCreacion: string;
    estado?: string;
}

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private startPromise: Promise<void> | null = null;

    buildConnection(): signalR.HubConnection {
        if (this.connection) return this.connection;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                // CLAVE: Permitir todos los transportes para redes restrictivas (universidad)
                // Si WebSocket falla, cae a SSE, y si SSE falla, cae a Long Polling (HTTP puro)
                transport: signalR.HttpTransportType.WebSockets 
                    | signalR.HttpTransportType.ServerSentEvents 
                    | signalR.HttpTransportType.LongPolling,
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'Bypass-Tunnel-Reminder': 'true'
                }
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Information)
            .build();

        return this.connection;
    }

    getConnection(): signalR.HubConnection | null {
        return this.connection;
    }

    start(): Promise<void> {
        const conn = this.buildConnection();
        
        if (conn.state === signalR.HubConnectionState.Connected) {
            return Promise.resolve();
        }

        if (!this.startPromise) {
            this.startPromise = conn.start().then(() => {
                console.log('✅ SignalR conectado (transporte:', (conn as any).connection?.transport?.name || 'auto', ')');
            }).catch(err => {
                console.error('❌ Error conectando a SignalR:', err);
                throw err;
            }).finally(() => {
                this.startPromise = null;
            });
        }

        return this.startPromise;
    }

    async joinGroup(group: string): Promise<void> {
        // CORRECCIÓN: Validar estado antes de invocar
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke('UnirseAlGrupo', group);
        }
    }

    async leaveGroup(group: string): Promise<void> {
        // CORRECCIÓN: Validar estado antes de invocar
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke('SalirDelGrupo', group);
        }
    }

    async stop(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }
}

export const signalRService = new SignalRService();