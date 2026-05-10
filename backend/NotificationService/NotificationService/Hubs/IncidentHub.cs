using Microsoft.AspNetCore.SignalR;

namespace NotificationService.Hubs;

/// <summary>
/// Hub principal de SignalR para notificaciones de incidentes de seguridad.
/// Los clientes se conectan a: ws://localhost:5009/hubs/incident
/// </summary>
public class IncidentHub : Hub<IIncidentClient>
{
    private readonly ILogger<IncidentHub> _logger;

    public IncidentHub(ILogger<IncidentHub> logger)
    {
        _logger = logger;
    }

    // ── Conexión ─────────────────────────────────────────────────────

    /// <summary>
    /// Se ejecuta automáticamente cuando un cliente se conecta al Hub.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Cliente conectado: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Se ejecuta automáticamente cuando un cliente se desconecta.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Cliente desconectado: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    // ── Grupos ───────────────────────────────────────────────────────

    /// <summary>
    /// Permite que un cliente se una a un grupo de notificaciones.
    /// Uso: cliente llama a hub.invoke("UnirseAlGrupo", "Guardias")
    ///      o hub.invoke("UnirseAlGrupo", "grupo-confianza-42")
    /// </summary>
    public async Task UnirseAlGrupo(string nombreGrupo)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, nombreGrupo);
        _logger.LogInformation(
            "Cliente {ConnectionId} se unió al grupo '{Grupo}'",
            Context.ConnectionId, nombreGrupo);
    }

    /// <summary>
    /// Permite que un cliente salga de un grupo.
    /// </summary>
    public async Task SalirDelGrupo(string nombreGrupo)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, nombreGrupo);
        _logger.LogInformation(
            "Cliente {ConnectionId} salió del grupo '{Grupo}'",
            Context.ConnectionId, nombreGrupo);
    }

    // ── Envío de alertas ─────────────────────────────────────────────

    /// <summary>
    /// Envía una alerta de incidente a TODOS los guardias conectados.
    /// Este método lo llama el IncidentService (T-13) cuando se crea un incidente.
    /// </summary>
    public async Task EnviarAlertaAGuardias(AlertaIncidenteDto alerta)
    {
        _logger.LogInformation(
            "Enviando alerta a grupo 'Guardias': Incidente {IdIncidente} — {TipoIncidente}",
            alerta.IdIncidente, alerta.TipoIncidente);

        await Clients.Group("Guardias").RecibirAlertaIncidente(alerta);
    }

    /// <summary>
    /// Envía una alerta a un grupo de confianza específico.
    /// Este método lo llama el IncidentService (T-13).
    /// </summary>
    public async Task EnviarAlertaAGrupoConfianza(string nombreGrupo, AlertaIncidenteDto alerta)
    {
        _logger.LogInformation(
            "Enviando alerta al grupo de confianza '{Grupo}': Incidente {IdIncidente}",
            nombreGrupo, alerta.IdIncidente);

        await Clients.Group(nombreGrupo).RecibirAlertaIncidente(alerta);
    }

    /// <summary>
    /// Método de prueba: envía un ping a todos los clientes conectados.
    /// Útil para verificar que el Hub está activo.
    /// </summary>
    public async Task Ping()
    {
        _logger.LogInformation("Ping recibido de {ConnectionId}", Context.ConnectionId);
        await Clients.Caller.RecibirAlertaIncidente(new AlertaIncidenteDto
        {
            IdIncidente = 0,
            NombreUsuario = "Sistema",
            Facultad = "UTA",
            Zona = "Test",
            TipoIncidente = "Ping",
            Mensaje = "✅ Conexión al Hub SignalR funcionando correctamente",
            FechaReporte = DateTime.Now
        });
    }
}
