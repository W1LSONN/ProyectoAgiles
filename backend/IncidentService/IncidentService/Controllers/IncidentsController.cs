using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentService.Data;
using IncidentService.DTOs;
using IncidentService.Models;
using IncidentService.Services;

namespace IncidentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<IncidentsController> _logger;
    private readonly NotificationClient _notificationClient; 

    public IncidentsController(AppDbContext context, ILogger<IncidentsController> logger,NotificationClient notificationClient)
    {
        _context = context;
        _logger = logger;
        _notificationClient = notificationClient;   
    }

    [HttpPost]
    public async Task<IActionResult> CrearIncidente([FromBody] CrearIncidenteRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var zonaExiste = await _context.Zonas.AnyAsync(z => z.IdZona == request.IdZona && z.Activa);
        if (!zonaExiste)
        {
            return BadRequest(new { mensaje = $"La zona con ID {request.IdZona} no existe o no está activa." });
        }

        var nuevoIncidente = new Incidente
        {
            IdUsuario     = request.IdUsuario,
            IdZona        = request.IdZona,
            TipoIncidente = request.TipoIncidente,
            Descripcion   = request.Descripcion,
            Estado        = "Activo",
            GuardiaAsignado = null,
            FechaReporte  = DateTime.Now,
            Latitud       = request.Latitud,
            Longitud      = request.Longitud
        };

        _context.Incidentes.Add(nuevoIncidente);
        await _context.SaveChangesAsync();

        // Obtener el nombre de la zona para enviarlo en la notificación
        var zona = await _context.Zonas.FindAsync(nuevoIncidente.IdZona);
        await _notificationClient.EnviarAlertaAsync(new AlertaNotificacionDto
        {
            IdIncidente   = nuevoIncidente.IdIncidente,
            IdUsuario     = nuevoIncidente.IdUsuario,
            NombreUsuario = $"Usuario #{nuevoIncidente.IdUsuario}",  // en T-15 se puede mejorar con el nombre real
            Facultad      = zona?.Nombre ?? "UTA",
            Zona          = zona?.Nombre ?? $"Zona {nuevoIncidente.IdZona}",
            TipoIncidente = nuevoIncidente.TipoIncidente,
            FechaReporte  = nuevoIncidente.FechaReporte,
            Latitud       = nuevoIncidente.Latitud,
            Longitud      = nuevoIncidente.Longitud
        });

        
        _logger.LogInformation(
            "Incidente creado: ID={IdIncidente}, Usuario={IdUsuario}, Zona={IdZona}, Tipo={Tipo}",
            nuevoIncidente.IdIncidente,
            nuevoIncidente.IdUsuario,
            nuevoIncidente.IdZona,
            nuevoIncidente.TipoIncidente);

        return CreatedAtAction(
            nameof(ObtenerIncidente),
            new { id = nuevoIncidente.IdIncidente },
            new
            {
                idIncidente   = nuevoIncidente.IdIncidente,
                idUsuario     = nuevoIncidente.IdUsuario,
                idZona        = nuevoIncidente.IdZona,
                tipoIncidente = nuevoIncidente.TipoIncidente,
                estado        = nuevoIncidente.Estado,
                guardiaAsignado = nuevoIncidente.GuardiaAsignado,
                fechaReporte  = nuevoIncidente.FechaReporte,
                mensaje       = "Incidente creado exitosamente."
            });
    }

    [HttpPatch("{id}/asignar")]
    public async Task<IActionResult> AsumirIncidente(int id, [FromBody] AsumirIncidenteRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var incidente = await _context.Incidentes.FirstOrDefaultAsync(i => i.IdIncidente == id);
        if (incidente == null)
        {
            return NotFound(new { mensaje = $"Incidente {id} no encontrado." });
        }

        if (incidente.Estado == "Asumido")
        {
            return BadRequest(new { mensaje = "El incidente ya ha sido asumido por otro guardia." });
        }

        if (incidente.Estado == "Cerrado")
        {
            return BadRequest(new { mensaje = "El incidente ya se encuentra cerrado." });
        }

        incidente.GuardiaAsignado = request.GuardiaAsignado.Trim();
        incidente.Estado = "Asumido";
        await _context.SaveChangesAsync();

        // Notificar a todos por SignalR en tiempo real que el estado cambió
        var zona = await _context.Zonas.FindAsync(incidente.IdZona);
        await _notificationClient.EnviarAlertaAsync(new AlertaNotificacionDto
        {
            IdIncidente   = incidente.IdIncidente,
            IdUsuario     = incidente.IdUsuario,
            NombreUsuario = $"Usuario #{incidente.IdUsuario}",
            Facultad      = zona?.Nombre ?? "UTA",
            Zona          = zona?.Nombre ?? $"Zona {incidente.IdZona}",
            TipoIncidente = incidente.TipoIncidente,
            FechaReporte  = incidente.FechaReporte,
            Latitud       = incidente.Latitud,
            Longitud      = incidente.Longitud,
            Estado        = incidente.Estado,
            GuardiaAsignado = incidente.GuardiaAsignado
        });

        return Ok(new
        {
            idIncidente = incidente.IdIncidente,
            estado = incidente.Estado,
            guardiaAsignado = incidente.GuardiaAsignado,
            fechaReporte = incidente.FechaReporte,
            mensaje = "Incidente asumido exitosamente."
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerIncidente(int id)
    {
        var incidente = await _context.Incidentes
            .Include(i => i.Zona)
            .FirstOrDefaultAsync(i => i.IdIncidente == id);

        if (incidente == null)
            return NotFound(new { mensaje = $"Incidente {id} no encontrado." });

        return Ok(new
        {
            idIncidente   = incidente.IdIncidente,
            idUsuario     = incidente.IdUsuario,
            zona          = incidente.Zona?.Nombre ?? "Desconocida",
            tipoIncidente = incidente.TipoIncidente,
            descripcion   = incidente.Descripcion,
            estado        = incidente.Estado,
            guardiaAsignado = incidente.GuardiaAsignado,
            fechaReporte  = incidente.FechaReporte,
            latitud       = incidente.Latitud,
            longitud      = incidente.Longitud
        });
    }

    [HttpGet]
    public async Task<IActionResult> ListarIncidentes([FromQuery] string? estado)
    {
        var query = _context.Incidentes.Include(i => i.Zona).AsQueryable();

        if (!string.IsNullOrEmpty(estado))
        {
            query = query.Where(i => i.Estado == estado);
        }

        var incidentes = await query
            .OrderByDescending(i => i.FechaReporte)
            .Select(i => new
            {
                idIncidente   = i.IdIncidente,
                idUsuario     = i.IdUsuario,
                zona          = i.Zona != null ? i.Zona.Nombre : "Desconocida",
                tipoIncidente = i.TipoIncidente,
                estado        = i.Estado,
                guardiaAsignado = i.GuardiaAsignado,
                fechaReporte  = i.FechaReporte,
                latitud       = i.Latitud,
                longitud      = i.Longitud
            })
            .ToListAsync();

        return Ok(incidentes);
    }

    [HttpGet("usuario/{idUsuario}")]
    public async Task<IActionResult> ObtenerIncidentesPorUsuario(int idUsuario)
    {
        var incidentes = await _context.Incidentes
            .Where(i => i.IdUsuario == idUsuario)
            .OrderByDescending(i => i.FechaReporte)
            .Select(i => new
            {
                idIncidente = i.IdIncidente,
                idUsuario = i.IdUsuario,
                idZona = i.IdZona,
                tipoIncidente = i.TipoIncidente,
                estado = i.Estado,
                fechaReporte = i.FechaReporte,
                mensaje = i.Descripcion,
                descripcion = i.Descripcion,
                latitud = i.Latitud,
                longitud = i.Longitud
            })
            .ToListAsync();

        return Ok(incidentes);
    }

    [HttpPut("{id}/cerrar")]
    public async Task<IActionResult> CerrarIncidente(int id, [FromBody] CerrarIncidenteRequest request)
    {
        // 1. Buscar el incidente en la BD
        var incidente = await _context.Incidentes.FindAsync(id);

        if (incidente == null)
        {
            return NotFound(new { mensaje = "Incidente no encontrado" });
        }

        if (incidente.Estado == "Cerrado")
        {
            return BadRequest(new { mensaje = "El incidente ya se encuentra cerrado" });
        }

        // 2. Actualizar los campos
        incidente.Estado = "Cerrado";
        incidente.ObservacionesCierre = request.Observaciones;
        incidente.FechaCierre = DateTime.Now;

        // 3. Guardar en la Base de Datos
        try
        {
            await _context.SaveChangesAsync();

            // Notificar a todos por SignalR en tiempo real que el incidente se cerró
            var zona = await _context.Zonas.FindAsync(incidente.IdZona);
            await _notificationClient.EnviarAlertaAsync(new AlertaNotificacionDto
            {
                IdIncidente   = incidente.IdIncidente,
                IdUsuario     = incidente.IdUsuario,
                NombreUsuario = $"Usuario #{incidente.IdUsuario}",
                Facultad      = zona?.Nombre ?? "UTA",
                Zona          = zona?.Nombre ?? $"Zona {incidente.IdZona}",
                TipoIncidente = incidente.TipoIncidente,
                FechaReporte  = incidente.FechaReporte,
                Latitud       = incidente.Latitud,
                Longitud      = incidente.Longitud,
                Estado        = incidente.Estado,
                GuardiaAsignado = incidente.GuardiaAsignado
            });

            return Ok(new
            {
                mensaje = "Incidente cerrado con éxito",
                incidente
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error al cerrar el incidente", detalle = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> ObtenerEstadisticas([FromQuery] string? periodo, [FromQuery] string? inicio, [FromQuery] string? fin, [FromQuery] string? zona, [FromQuery] string? tipo)
    {
        // 1. Rango de fechas
        DateTime fechaInicio;
        DateTime fechaFin;
        DateTime fechaInicioPrevio;

        if (!string.IsNullOrWhiteSpace(inicio) && !string.IsNullOrWhiteSpace(fin))
        {
            if (!DateTime.TryParseExact(inicio, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var inicioParsed)
                || !DateTime.TryParseExact(fin, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var finParsed))
            {
                return BadRequest(new { mensaje = "Fechas inválidas. Use el formato YYYY-MM-DD." });
            }

            fechaInicio = inicioParsed.Date;
            fechaFin = finParsed.Date.AddDays(1).AddTicks(-1); // Incluir todo el día de fin
            var duracion = fechaFin - fechaInicio;
            fechaInicioPrevio = fechaInicio.Add(-duracion);
        }
        else if (periodo == "custom")
        {
            // Si se solicitó filtro personalizado sin fechas válidas,
            // retornamos datos vacíos en lugar de usar el periodo por defecto.
            return Ok(new StatsResponseDto
            {
                Globales = new GlobalStatsDto(),
                PorZona = new List<ZonaStatsDto>(),
                PorTipo = new List<TipoStatsDto>(),
                PorHora = Enumerable.Range(0, 24)
                    .Select(h => new HoraStatsDto { Hora = $"{h:D2}:00", Total = 0 })
                    .ToList()
            });
        }
        else
        {
            // Periodos predefinidos
            fechaFin = DateTime.Now;
            fechaInicio = periodo switch
            {
                "dia" => DateTime.Today,
                "semana" => DateTime.Today.AddDays(-7),
                _ => DateTime.Today.AddDays(-30),
            };
            fechaInicioPrevio = fechaInicio.AddDays(-(fechaFin - fechaInicio).TotalDays);
        }

        // 2. Traer incidentes de la BD
        var queryActuales = _context.Incidentes
            .Include(i => i.Zona)
            .Where(i => i.FechaReporte >= fechaInicio && i.FechaReporte <= fechaFin);

        // Filtro adicional por nombre de zona
        if (!string.IsNullOrWhiteSpace(zona))
        {
            queryActuales = queryActuales.Where(i => i.Zona != null && i.Zona.Nombre == zona);
        }

        // Filtro adicional por tipo de incidente
        if (!string.IsNullOrWhiteSpace(tipo))
        {
            queryActuales = queryActuales.Where(i => i.TipoIncidente == tipo);
        }

        var incidentesActuales = await queryActuales.ToListAsync();

        var incidentesPrevios = await _context.Incidentes
            .Where(i => i.FechaReporte >= fechaInicioPrevio && i.FechaReporte < fechaInicio)
            .ToListAsync();

        // 3. Procesar Globales
        var totales = new GlobalStatsDto
        {
            Total = incidentesActuales.Count,
            Activos = incidentesActuales.Count(i => i.Estado == "Activo"),
            Asumidos = incidentesActuales.Count(i => i.Estado == "Asumido"),
            Cerrados = incidentesActuales.Count(i => i.Estado == "Cerrado"),
            Prev_total = incidentesPrevios.Count,
            Prev_activos = incidentesPrevios.Count(i => i.Estado == "Activo")
        };

        // 4. Procesar Por Zona
        var porZona = incidentesActuales
            .Where(i => i.Zona != null)
            .GroupBy(i => i.Zona.Nombre)
            .Select(g => new ZonaStatsDto { Nombre = g.Key, Total = g.Count() })
            .OrderByDescending(z => z.Total)
            .ToList();

        // 5. Procesar Por Tipo
        var porTipo = incidentesActuales
            .GroupBy(i => i.TipoIncidente)
            .Select(g => new TipoStatsDto { Nombre = g.Key, Valor = g.Count() })
            .OrderByDescending(t => t.Valor)
            .ToList();

        // 6. Procesar Por Hora (24 horas)
        var horasDelDia = Enumerable.Range(0, 24).Select(h => $"{h:D2}:00").ToList();
        var conteoPorHora = incidentesActuales
            .GroupBy(i => i.FechaReporte.Hour)
            .ToDictionary(g => g.Key, g => g.Count());

        var porHora = horasDelDia.Select((horaStr, index) => new HoraStatsDto
        {
            Hora = horaStr,
            Total = conteoPorHora.ContainsKey(index) ? conteoPorHora[index] : 0
        }).ToList();

        // 7. Retornar DTO al frontend
        var response = new StatsResponseDto
        {
            Globales = totales,
            PorZona = porZona,
            PorTipo = porTipo,
            PorHora = porHora
        };

        return Ok(response);
    }
}
