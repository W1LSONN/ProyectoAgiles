using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentService.Data;
using IncidentService.DTOs;
using IncidentService.Models;

namespace IncidentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CamarasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CamarasController> _logger;

    public CamarasController(AppDbContext context, ILogger<CamarasController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> ListarCamaras([FromQuery] int? idZona, [FromQuery] string? estado)
    {
        var query = _context.Camaras.Include(c => c.Zona).AsQueryable();

        if (idZona.HasValue)
        {
            query = query.Where(c => c.IdZona == idZona.Value);
        }

        if (!string.IsNullOrEmpty(estado))
        {
            query = query.Where(c => c.Estado.Equals(estado, StringComparison.OrdinalIgnoreCase));
        }

        var camaras = await query.Select(c => new {
            idCamara = c.IdCamara,
            nombre = c.Nombre,
            latitud = c.Latitud,
            longitud = c.Longitud,
            urlStream = c.UrlStream,
            estado = c.Estado,
            idZona = c.IdZona,
            nombreZona = c.Zona != null ? c.Zona.Nombre : null
        }).ToListAsync();

        return Ok(camaras);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerCamara(int id)
    {
        var camara = await _context.Camaras.Include(c => c.Zona).FirstOrDefaultAsync(c => c.IdCamara == id);
        if (camara == null)
        {
            return NotFound(new { mensaje = $"Cámara con ID {id} no encontrada." });
        }

        return Ok(new {
            idCamara = camara.IdCamara,
            nombre = camara.Nombre,
            latitud = camara.Latitud,
            longitud = camara.Longitud,
            urlStream = camara.UrlStream,
            estado = camara.Estado,
            idZona = camara.IdZona,
            nombreZona = camara.Zona != null ? camara.Zona.Nombre : null
        });
    }

    [HttpPost]
    public async Task<IActionResult> CrearCamara([FromBody] CamaraRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (request.IdZona.HasValue)
        {
            var zonaExiste = await _context.Zonas.AnyAsync(z => z.IdZona == request.IdZona.Value);
            if (!zonaExiste)
            {
                return BadRequest(new { mensaje = $"La zona con ID {request.IdZona} no existe." });
            }
        }

        var nuevaCamara = new Camara
        {
            Nombre = request.Nombre,
            Latitud = request.Latitud,
            Longitud = request.Longitud,
            UrlStream = request.UrlStream,
            Estado = request.Estado,
            IdZona = request.IdZona
        };

        _context.Camaras.Add(nuevaCamara);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cámara creada: ID={IdCamara}, Nombre={Nombre}", nuevaCamara.IdCamara, nuevaCamara.Nombre);

        return CreatedAtAction(nameof(ObtenerCamara), new { id = nuevaCamara.IdCamara }, new {
            idCamara = nuevaCamara.IdCamara,
            nombre = nuevaCamara.Nombre,
            latitud = nuevaCamara.Latitud,
            longitud = nuevaCamara.Longitud,
            urlStream = nuevaCamara.UrlStream,
            estado = nuevaCamara.Estado,
            idZona = nuevaCamara.IdZona
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarCamara(int id, [FromBody] CamaraRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var camara = await _context.Camaras.FindAsync(id);
        if (camara == null)
        {
            return NotFound(new { mensaje = $"Cámara con ID {id} no encontrada." });
        }

        if (request.IdZona.HasValue)
        {
            var zonaExiste = await _context.Zonas.AnyAsync(z => z.IdZona == request.IdZona.Value);
            if (!zonaExiste)
            {
                return BadRequest(new { mensaje = $"La zona con ID {request.IdZona} no existe." });
            }
        }

        camara.Nombre = request.Nombre;
        camara.Latitud = request.Latitud;
        camara.Longitud = request.Longitud;
        camara.UrlStream = request.UrlStream;
        camara.Estado = request.Estado;
        camara.IdZona = request.IdZona;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cámara actualizada: ID={IdCamara}", id);

        return Ok(new {
            idCamara = camara.IdCamara,
            nombre = camara.Nombre,
            latitud = camara.Latitud,
            longitud = camara.Longitud,
            urlStream = camara.UrlStream,
            estado = camara.Estado,
            idZona = camara.IdZona
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarCamara(int id)
    {
        var camara = await _context.Camaras.FindAsync(id);
        if (camara == null)
        {
            return NotFound(new { mensaje = $"Cámara con ID {id} no encontrada." });
        }

        _context.Camaras.Remove(camara);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cámara eliminada: ID={IdCamara}", id);

        return Ok(new { mensaje = "Cámara eliminada exitosamente." });
    }
}
