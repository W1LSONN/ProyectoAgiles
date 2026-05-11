import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5009/hubs/incident';

// DTO que llega desde el backend (igual que AlertaIncidenteDto en C#)
export interface AlertaIncidente {
    idIncidente: number;
    nombreUsuario: string;
    facultad: string;
    zona: string;
    tipoIncidente: string;
    mensaje: string;
    fechaReporte: string;
    guardiaAsignado?: string; // Opcional — se asigna cuando el guardia toma el caso
}


class SignalRService {
    private connection: signalR.HubConnection | null = null;

    buildConnection(): signalR.HubConnection {
        if (this.connection) return this.connection;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL)
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // reintentos
            .configureLogging(signalR.LogLevel.Information)
            .build();

        return this.connection;
    }

    getConnection(): signalR.HubConnection | null {
        return this.connection;
    }

    async start(): Promise<void> {
        const conn = this.buildConnection();
        if (conn.state === signalR.HubConnectionState.Disconnected) {
            await conn.start();
            console.log('✅ SignalR conectado');
        }
    }

    async joinGroup(group: string): Promise<void> {
        await this.connection?.invoke('UnirseAlGrupo', group);
    }

    async leaveGroup(group: string): Promise<void> {
        await this.connection?.invoke('SalirDelGrupo', group);
    }

    async stop(): Promise<void> {
        await this.connection?.stop();
        this.connection = null;
    }
}

export const signalRService = new SignalRService();
