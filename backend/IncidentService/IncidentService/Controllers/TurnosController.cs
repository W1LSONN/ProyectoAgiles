using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentService.Data;
using IncidentService.DTOs;
using IncidentService.Models;

namespace IncidentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TurnosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<TurnosController> _logger;

    public TurnosController(AppDbContext context, ILogger<TurnosController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>Listar todos los turnos (opcionalmente solo activos)</summary>
    [HttpGet]
    public async Task<IActionResult> ListarTurnos([FromQuery] bool? soloActivos)
    {
        var query = _context.Turnos.AsQueryable();
        if (soloActivos == true)
            query = query.Where(t => t.Activo);

        var turnos = await query.OrderBy(t => t.HoraInicio).ToListAsync();
        return Ok(turnos);
    }

    /// <summary>Obtener turno activo de un guardia (basado en hora actual y día)</summary>
    [HttpGet("activo")]
    public async Task<IActionResult> TurnoActivo([FromQuery] int idGuardia)
    {
        var ahora = DateTime.Now;
        var horaActual = ahora.TimeOfDay;
        var diaActual = ahora.ToString("dddd", new System.Globalization.CultureInfo("es-ES"));
        // Capitalizar primera letra
        diaActual = char.ToUpper(diaActual[0]) + diaActual.Substring(1);

        var turnos = await _context.Turnos
            .Where(t => t.Activo && (t.IdGuardia == idGuardia || t.IdGuardia == 0))
            .Where(t => t.DiaSemana == "Todos" || t.DiaSemana == diaActual)
            .ToListAsync();

        // Buscar turno que coincida con la hora actual
        var turnoActivo = turnos.FirstOrDefault(t =>
        {
            if (t.HoraFin > t.HoraInicio)
            {
                // Turno normal (ej: 07:00 a 13:00)
                return horaActual >= t.HoraInicio && horaActual < t.HoraFin;
            }
            else
            {
                // Turno nocturno que cruza medianoche (ej: 19:00 a 07:00)
                return horaActual >= t.HoraInicio || horaActual < t.HoraFin;
            }
        });

        if (turnoActivo == null)
            return Ok(new { mensaje = "Sin turno activo", turno = (object?)null });

        return Ok(turnoActivo);
    }

    /// <summary>Obtener un turno por ID</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerTurno(int id)
    {
        var turno = await _context.Turnos.FindAsync(id);
        if (turno == null) return NotFound(new { mensaje = "Turno no encontrado" });
        return Ok(turno);
    }

    /// <summary>Crear un nuevo turno</summary>
    [HttpPost]
    public async Task<IActionResult> CrearTurno([FromBody] CrearTurnoRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var turno = new Turno
        {
            NombreTurno = request.NombreTurno,
            HoraInicio = request.HoraInicio,
            HoraFin = request.HoraFin,
            IdGuardia = request.IdGuardia,
            NombreGuardia = request.NombreGuardia,
            DiaSemana = request.DiaSemana,
            Activo = true,
            FechaCreacion = DateTime.Now
        };

        _context.Turnos.Add(turno);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Turno creado: {Nombre} ({Inicio}-{Fin})", turno.NombreTurno, turno.HoraInicio, turno.HoraFin);
        return CreatedAtAction(nameof(ObtenerTurno), new { id = turno.IdTurno }, turno);
    }

    /// <summary>Editar un turno existente</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> EditarTurno(int id, [FromBody] EditarTurnoRequest request)
    {
        var turno = await _context.Turnos.FindAsync(id);
        if (turno == null) return NotFound(new { mensaje = "Turno no encontrado" });

        if (request.NombreTurno != null) turno.NombreTurno = request.NombreTurno;
        if (request.HoraInicio.HasValue) turno.HoraInicio = request.HoraInicio.Value;
        if (request.HoraFin.HasValue) turno.HoraFin = request.HoraFin.Value;
        if (request.IdGuardia.HasValue) turno.IdGuardia = request.IdGuardia.Value;
        if (request.NombreGuardia != null) turno.NombreGuardia = request.NombreGuardia;
        if (request.DiaSemana != null) turno.DiaSemana = request.DiaSemana;
        if (request.Activo.HasValue) turno.Activo = request.Activo.Value;

        await _context.SaveChangesAsync();
        return Ok(turno);
    }

    /// <summary>Desactivar un turno</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DesactivarTurno(int id)
    {
        var turno = await _context.Turnos.FindAsync(id);
        if (turno == null) return NotFound(new { mensaje = "Turno no encontrado" });

        turno.Activo = false;
        await _context.SaveChangesAsync();
        return Ok(new { mensaje = "Turno desactivado" });
    }
}
