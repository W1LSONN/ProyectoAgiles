using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.Hubs;

namespace NotificationService.Controllers;

/// <summary>
/// Endpoint interno que llama el IncidentService para disparar notificaciones SignalR.
/// POST /api/notifications/alert
/// POST /api/notifications/reporte
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IHubContext<IncidentHub, IIncidentClient> _hubContext;
    private readonly AppDbContext _context;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        IHubContext<IncidentHub, IIncidentClient> hubContext,
        AppDbContext context,
        ILogger<NotificationsController> logger)
    {
        _hubContext = hubContext;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Recibe los datos de un incidente recién creado y los broadcast
    /// a todos los Guardias y Admins conectados por SignalR, además de los grupos de confianza.
    /// </summary>
    [HttpPost("alert")]
    public async Task<IActionResult> EnviarAlerta([FromBody] AlertaRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var alerta = new AlertaIncidenteDto
        {
            IdIncidente   = request.IdIncidente,
            IdUsuario     = request.IdUsuario,
            NombreUsuario = request.NombreUsuario,
            Facultad      = request.Facultad,
            Zona          = request.Zona,
            TipoIncidente = request.TipoIncidente,
            Mensaje       = $"🚨 Incidente {request.TipoIncidente} en {request.Zona} (Estado: {request.Estado ?? "Activo"})",
            FechaReporte  = request.FechaReporte,
            Latitud       = request.Latitud,
            Longitud      = request.Longitud,
            Estado        = request.Estado ?? "Activo",
            GuardiaAsignado = request.GuardiaAsignado
        };

        // Enviar a Guardias
        await _hubContext.Clients.Group("Guardias").RecibirAlertaIncidente(alerta);

        // Enviar a Admins
        await _hubContext.Clients.Group("Admins").RecibirAlertaIncidente(alerta);

        // Si es una alerta activa y tenemos el ID del usuario, notificar a sus grupos de confianza
        if (request.IdUsuario.HasValue && (request.Estado == null || request.Estado.Equals("Activo", StringComparison.OrdinalIgnoreCase)))
        {
            try
            {
                var idGrupos = await _context.UsuarioGrupos
                    .Where(ug => ug.IdUsuario == request.IdUsuario.Value)
                    .Select(ug => ug.IdGrupo)
                    .ToListAsync();

                foreach (var idGrupo in idGrupos)
                {
                    var groupName = $"grupo-confianza-{idGrupo}";
                    _logger.LogInformation("Reenviando alerta de grupo de confianza a: {Grupo}", groupName);
                    await _hubContext.Clients.Group(groupName).RecibirAlertaIncidente(alerta);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al notificar a los grupos de confianza del usuario {UsuarioId}", request.IdUsuario);
            }
        }

        _logger.LogInformation(
            "Alerta SignalR enviada — Incidente #{IdIncidente}, Tipo: {Tipo}, Estado: {Estado}",
            alerta.IdIncidente, alerta.TipoIncidente, alerta.Estado);

        return Ok(new { mensaje = "Alerta enviada a Guardias, Admins y grupos de confianza." });
    }

    /// <summary>
    /// Recibe un reporte de guardia y lo broadcast a todos los Admins conectados por SignalR.
    /// </summary>
    [HttpPost("reporte")]
    public async Task<IActionResult> EnviarReporte([FromBody] ReporteRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var reporte = new ReporteGuardiaDto
        {
            IdReporte = request.IdReporte,
            NumeroReporte = request.NumeroReporte,
            NombreGuardia = request.NombreGuardia,
            Titulo = request.Titulo,
            Descripcion = request.Descripcion,
            TipoReporte = request.TipoReporte,
            Prioridad = request.Prioridad,
            Zona = request.Zona,
            HoraIncidente = request.HoraIncidente,
            FechaCreacion = request.FechaCreacion
        };

        // Enviar solo a Admins
        await _hubContext.Clients.Group("Admins").RecibirNuevoReporte(reporte);

        _logger.LogInformation(
            "Reporte SignalR enviado a Admins — #{Numero} por {Guardia}",
            reporte.NumeroReporte, reporte.NombreGuardia);

        return Ok(new { mensaje = "Reporte enviado a los administradores." });
    }
}

/// <summary>
/// DTO que recibe el NotificationService desde el IncidentService.
/// </summary>
public class AlertaRequest
{
    public int IdIncidente { get; set; }
    public int? IdUsuario { get; set; }
    public string NombreUsuario { get; set; } = "Usuario desconocido";
    public string Facultad { get; set; } = string.Empty;
    public string Zona { get; set; } = string.Empty;
    public string TipoIncidente { get; set; } = string.Empty;
    public DateTime FechaReporte { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public string? Estado { get; set; }
    public string? GuardiaAsignado { get; set; }
}

/// <summary>
/// DTO que recibe el NotificationService desde el IncidentService para reportes de guardia.
/// </summary>
public class ReporteRequest
{
    public int IdReporte { get; set; }
    public string NumeroReporte { get; set; } = string.Empty;
    public string NombreGuardia { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string TipoReporte { get; set; } = string.Empty;
    public string Prioridad { get; set; } = string.Empty;
    public string Zona { get; set; } = string.Empty;
    public DateTime HoraIncidente { get; set; }
    public DateTime FechaCreacion { get; set; }
}
