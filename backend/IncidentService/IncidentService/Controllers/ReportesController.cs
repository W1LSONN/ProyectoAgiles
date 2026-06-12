using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentService.Data;
using IncidentService.DTOs;
using IncidentService.Models;
using IncidentService.Services;

namespace IncidentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ReportesController> _logger;
    private readonly NotificationClient _notificationClient;

    public ReportesController(AppDbContext context, ILogger<ReportesController> logger, NotificationClient notificationClient)
    {
        _context = context;
        _logger = logger;
        _notificationClient = notificationClient;
    }

    /// <summary>Crear un reporte de guardia con número auto-incremental</summary>
    [HttpPost]
    public async Task<IActionResult> CrearReporte([FromBody] CrearReporteRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Generar número de reporte auto-incremental: RPT-AAAAMM-NNNN
        var ahora = DateTime.Now;
        var prefijo = $"RPT-{ahora:yyyyMM}";
        var ultimoNumero = await _context.ReportesGuardia
            .Where(r => r.NumeroReporte.StartsWith(prefijo))
            .CountAsync();
        var numeroReporte = $"{prefijo}-{(ultimoNumero + 1):D4}";

        var reporte = new ReporteGuardia
        {
            NumeroReporte = numeroReporte,
            IdGuardia = request.IdGuardia,
            NombreGuardia = request.NombreGuardia,
            IdTurno = request.IdTurno,
            Titulo = request.Titulo,
            Descripcion = request.Descripcion,
            TipoReporte = request.TipoReporte,
            Prioridad = request.Prioridad,
            IdZona = request.IdZona,
            Latitud = request.Latitud,
            Longitud = request.Longitud,
            HoraIncidente = request.HoraIncidente ?? ahora,
            FechaCreacion = ahora,
            Estado = "Enviado"
        };

        _context.ReportesGuardia.Add(reporte);
        await _context.SaveChangesAsync();

        // Notificar al admin en tiempo real via SignalR
        try
        {
            var zona = reporte.IdZona.HasValue
                ? await _context.Zonas.FindAsync(reporte.IdZona.Value)
                : null;

            await _notificationClient.EnviarReporteAsync(new ReporteNotificacionDto
            {
                IdReporte = reporte.IdReporte,
                NumeroReporte = reporte.NumeroReporte,
                NombreGuardia = reporte.NombreGuardia,
                Titulo = reporte.Titulo,
                Descripcion = reporte.Descripcion,
                TipoReporte = reporte.TipoReporte,
                Prioridad = reporte.Prioridad,
                Zona = zona?.Nombre ?? "—",
                HoraIncidente = reporte.HoraIncidente,
                FechaCreacion = reporte.FechaCreacion
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al notificar reporte al Admin via SignalR");
        }

        _logger.LogInformation("Reporte creado: {Numero} por {Guardia}", numeroReporte, reporte.NombreGuardia);

        return CreatedAtAction(nameof(ObtenerReporte), new { id = reporte.IdReporte }, new
        {
            idReporte = reporte.IdReporte,
            numeroReporte = reporte.NumeroReporte,
            mensaje = "Reporte creado exitosamente"
        });
    }

    /// <summary>Listar todos los reportes con filtros opcionales</summary>
    [HttpGet]
    public async Task<IActionResult> ListarReportes(
        [FromQuery] int? idGuardia,
        [FromQuery] int? idTurno,
        [FromQuery] string? tipo,
        [FromQuery] string? prioridad,
        [FromQuery] string? estado,
        [FromQuery] string? desde,
        [FromQuery] string? hasta)
    {
        var query = _context.ReportesGuardia
            .Include(r => r.Zona)
            .Include(r => r.Turno)
            .AsQueryable();

        if (idGuardia.HasValue) query = query.Where(r => r.IdGuardia == idGuardia.Value);
        if (idTurno.HasValue) query = query.Where(r => r.IdTurno == idTurno.Value);
        if (!string.IsNullOrEmpty(tipo)) query = query.Where(r => r.TipoReporte == tipo);
        if (!string.IsNullOrEmpty(prioridad)) query = query.Where(r => r.Prioridad == prioridad);
        if (!string.IsNullOrEmpty(estado)) query = query.Where(r => r.Estado == estado);

        if (DateTime.TryParse(desde, out var fechaDesde))
            query = query.Where(r => r.FechaCreacion >= fechaDesde);
        if (DateTime.TryParse(hasta, out var fechaHasta))
            query = query.Where(r => r.FechaCreacion <= fechaHasta.Date.AddDays(1).AddTicks(-1));

        var reportes = await query
            .OrderByDescending(r => r.FechaCreacion)
            .Select(r => new
            {
                r.IdReporte,
                r.NumeroReporte,
                r.IdGuardia,
                r.NombreGuardia,
                r.IdTurno,
                turnoNombre = r.Turno != null ? r.Turno.NombreTurno : null,
                r.Titulo,
                r.Descripcion,
                r.TipoReporte,
                r.Prioridad,
                zona = r.Zona != null ? r.Zona.Nombre : null,
                r.Latitud,
                r.Longitud,
                r.HoraIncidente,
                r.FechaCreacion,
                r.Estado
            })
            .ToListAsync();

        return Ok(reportes);
    }

    /// <summary>Reportes del guardia en su turno activo</summary>
    [HttpGet("guardia/{idGuardia}")]
    public async Task<IActionResult> ReportesDelGuardia(int idGuardia)
    {
        var reportes = await _context.ReportesGuardia
            .Include(r => r.Zona)
            .Include(r => r.Turno)
            .Where(r => r.IdGuardia == idGuardia)
            .OrderByDescending(r => r.FechaCreacion)
            .Select(r => new
            {
                r.IdReporte,
                r.NumeroReporte,
                r.Titulo,
                r.Descripcion,
                r.TipoReporte,
                r.Prioridad,
                zona = r.Zona != null ? r.Zona.Nombre : null,
                turnoNombre = r.Turno != null ? r.Turno.NombreTurno : null,
                r.HoraIncidente,
                r.FechaCreacion,
                r.Estado
            })
            .ToListAsync();

        return Ok(reportes);
    }

    /// <summary>Obtener un reporte por ID</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerReporte(int id)
    {
        var r = await _context.ReportesGuardia
            .Include(r => r.Zona)
            .Include(r => r.Turno)
            .FirstOrDefaultAsync(r => r.IdReporte == id);

        if (r == null) return NotFound(new { mensaje = "Reporte no encontrado" });

        return Ok(new
        {
            r.IdReporte,
            r.NumeroReporte,
            r.IdGuardia,
            r.NombreGuardia,
            r.IdTurno,
            turnoNombre = r.Turno?.NombreTurno,
            r.Titulo,
            r.Descripcion,
            r.TipoReporte,
            r.Prioridad,
            zona = r.Zona?.Nombre,
            r.Latitud,
            r.Longitud,
            r.HoraIncidente,
            r.FechaCreacion,
            r.Estado
        });
    }

    /// <summary>Cambiar estado de un reporte (Admin marca como leído/resuelto)</summary>
    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoReporteRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var reporte = await _context.ReportesGuardia.FindAsync(id);
        if (reporte == null) return NotFound(new { mensaje = "Reporte no encontrado" });

        var estadosValidos = new[] { "Enviado", "Leído", "Resuelto" };
        if (!estadosValidos.Contains(request.Estado))
            return BadRequest(new { mensaje = $"Estado inválido. Válidos: {string.Join(", ", estadosValidos)}" });

        reporte.Estado = request.Estado;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = $"Reporte marcado como {request.Estado}", reporte.IdReporte, reporte.Estado });
    }
}
