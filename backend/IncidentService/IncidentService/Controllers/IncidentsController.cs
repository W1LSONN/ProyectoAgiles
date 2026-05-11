using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentService.Data;
using IncidentService.DTOs;
using IncidentService.Models;

namespace IncidentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<IncidentsController> _logger;

    public IncidentsController(AppDbContext context, ILogger<IncidentsController> logger)
    {
        _context = context;
        _logger = logger;
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
            FechaReporte  = DateTime.Now
        };

        _context.Incidentes.Add(nuevoIncidente);
        await _context.SaveChangesAsync();

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
                fechaReporte  = nuevoIncidente.FechaReporte,
                mensaje       = "Incidente creado exitosamente."
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
            zona          = incidente.Zona.Nombre,
            tipoIncidente = incidente.TipoIncidente,
            descripcion   = incidente.Descripcion,
            estado        = incidente.Estado,
            fechaReporte  = incidente.FechaReporte
        });
    }

    [HttpGet]
    public async Task<IActionResult> ListarIncidentes()
    {
        var incidentes = await _context.Incidentes
            .Include(i => i.Zona)
            .OrderByDescending(i => i.FechaReporte)
            .Select(i => new
            {
                idIncidente   = i.IdIncidente,
                idUsuario     = i.IdUsuario,
                zona          = i.Zona.Nombre,
                tipoIncidente = i.TipoIncidente,
                estado        = i.Estado,
                fechaReporte  = i.FechaReporte
            })
            .ToListAsync();

        return Ok(incidentes);
    }
}
