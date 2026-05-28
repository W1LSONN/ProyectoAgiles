using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NotificationService.Hubs;

namespace NotificationService.Controllers;

/// <summary>
/// Endpoint interno que llama el IncidentService para disparar notificaciones SignalR.
/// POST /api/notifications/alert
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IHubContext<IncidentHub, IIncidentClient> _hubContext;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        IHubContext<IncidentHub, IIncidentClient> hubContext,
        ILogger<NotificationsController> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Recibe los datos de un incidente recién creado y los broadcast
    /// a todos los Guardias y Admins conectados por SignalR.
    /// </summary>
    [HttpPost("alert")]
    public async Task<IActionResult> EnviarAlerta([FromBody] AlertaRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var alerta = new AlertaIncidenteDto
        {
            IdIncidente   = request.IdIncidente,
            NombreUsuario = request.NombreUsuario,
            Facultad      = request.Facultad,
            Zona          = request.Zona,
            TipoIncidente = request.TipoIncidente,
            Mensaje       = $"🚨 Nuevo incidente: {request.TipoIncidente} en {request.Zona}",
            FechaReporte  = request.FechaReporte,
            Latitud       = request.Latitud,
            Longitud      = request.Longitud
        };

        // Enviar a Guardias
        await _hubContext.Clients.Group("Guardias").RecibirAlertaIncidente(alerta);

        // Enviar a Admins
        await _hubContext.Clients.Group("Admins").RecibirAlertaIncidente(alerta);

        _logger.LogInformation(
            "Alerta SignalR enviada — Incidente #{IdIncidente}, Tipo: {Tipo}, Zona: {Zona}",
            alerta.IdIncidente, alerta.TipoIncidente, alerta.Zona);

        return Ok(new { mensaje = "Alerta enviada a Guardias y Admins." });
    }
}

/// <summary>
/// DTO que recibe el NotificationService desde el IncidentService.
/// </summary>
public class AlertaRequest
{
    public int IdIncidente { get; set; }
    public string NombreUsuario { get; set; } = "Usuario desconocido";
    public string Facultad { get; set; } = string.Empty;
    public string Zona { get; set; } = string.Empty;
    public string TipoIncidente { get; set; } = string.Empty;
    public DateTime FechaReporte { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
}
