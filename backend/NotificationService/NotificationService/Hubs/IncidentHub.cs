using Microsoft.AspNetCore.SignalR;
using NotificationService.Data;
using NotificationService.Models;

namespace NotificationService.Hubs;

/// <summary>
/// Hub principal de SignalR para notificaciones de incidentes de seguridad.
/// Los clientes se conectan a: ws://localhost:5199/hubs/incident
/// </summary>
public class IncidentHub : Hub<IIncidentClient>
{
    private readonly ILogger<IncidentHub> _logger;
    private readonly AppDbContext _context;

    public IncidentHub(ILogger<IncidentHub> logger, AppDbContext context)
    {
        _logger = logger;
        _context = context;
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

        try
        {
            // 1. Guardar la notificación en la Base de Datos
            var nuevaNotificacion = new Notificacion 
            {
                IdIncidente = alerta.IdIncidente,
                IdReceptor = 0, // Como es un envío a un grupo general, usamos 0
                TipoReceptor = "Guardias",
                Mensaje = alerta.Mensaje,
                FechaEnvio = DateTime.Now
            };
            _context.Notificaciones.Add(nuevaNotificacion);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al guardar la notificación de guardias en la base de datos.");
        }

        // 2. Transmitir en tiempo real a los guardias conectados
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

        try
        {
            var nuevaNotificacion = new Notificacion 
            {
                IdIncidente = alerta.IdIncidente,
                IdReceptor = 0,
                TipoReceptor = "GrupoConfianza",
                Mensaje = $"[Grupo {nombreGrupo}] {alerta.Mensaje}",
                FechaEnvio = DateTime.Now
            };
            _context.Notificaciones.Add(nuevaNotificacion);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al guardar la notificación de grupo en la base de datos.");
        }

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
