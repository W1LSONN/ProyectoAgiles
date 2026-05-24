using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentService.Data;
using IncidentService.DTOs;
using IncidentService.Models;

namespace IncidentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ZonasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ZonasController> _logger;

    public ZonasController(AppDbContext context, ILogger<ZonasController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> ListarZonas([FromQuery] bool? soloActivas)
    {
        var query = _context.Zonas.AsQueryable();

        if (soloActivas.HasValue && soloActivas.Value)
        {
            query = query.Where(z => z.Activa);
        }

        var zonas = await query.ToListAsync();
        return Ok(zonas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerZona(int id)
    {
        var zona = await _context.Zonas.FindAsync(id);
        if (zona == null)
        {
            return NotFound(new { mensaje = $"Zona con ID {id} no encontrada." });
        }
        return Ok(zona);
    }

    [HttpPost]
    public async Task<IActionResult> CrearZona([FromBody] ZonaRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var nuevaZona = new Zona
        {
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            Latitud = request.Latitud,
            Longitud = request.Longitud,
            CoordenadasPoligono = request.CoordenadasPoligono,
            Activa = request.Activa
        };

        _context.Zonas.Add(nuevaZona);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Zona creada: ID={IdZona}, Nombre={Nombre}", nuevaZona.IdZona, nuevaZona.Nombre);

        return CreatedAtAction(nameof(ObtenerZona), new { id = nuevaZona.IdZona }, nuevaZona);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarZona(int id, [FromBody] ZonaRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var zona = await _context.Zonas.FindAsync(id);
        if (zona == null)
        {
            return NotFound(new { mensaje = $"Zona con ID {id} no encontrada." });
        }

        zona.Nombre = request.Nombre;
        zona.Descripcion = request.Descripcion;
        zona.Latitud = request.Latitud;
        zona.Longitud = request.Longitud;
        zona.CoordenadasPoligono = request.CoordenadasPoligono;
        zona.Activa = request.Activa;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Zona actualizada: ID={IdZona}", id);

        return Ok(zona);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarZona(int id)
    {
        var zona = await _context.Zonas.FindAsync(id);
        if (zona == null)
        {
            return NotFound(new { mensaje = $"Zona con ID {id} no encontrada." });
        }

        // Si la zona tiene incidentes relacionados, hacemos soft delete (Activa = false)
        // para evitar violaciones de clave foránea en la base de datos.
        var tieneIncidentes = await _context.Incidentes.AnyAsync(i => i.IdZona == id);
        if (tieneIncidentes)
        {
            zona.Activa = false;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "La zona tiene incidentes relacionados. Se ha desactivado (soft delete).", zona });
        }

        _context.Zonas.Remove(zona);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Zona eliminada: ID={IdZona}", id);

        return Ok(new { mensaje = "Zona eliminada exitosamente." });
    }
}
