using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IncidentService.Data;
using IncidentService.Models;

namespace IncidentService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public IncidentsController(AppDbContext context)
    {
        _context = context;
    }

    // POST api/incidents — crear nuevo incidente
    [HttpPost]
    public async Task<IActionResult> CrearIncidente([FromBody] CrearIncidenteDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var zonaExiste = await _context.Zonas.AnyAsync(z => z.IdZona == request.IdZona && z.Activa);
        if (!zonaExiste)
            return BadRequest(new { mensaje = $"La zona {request.IdZona} no existe o no está activa." });

        var incidente = new Incidente
        {
            IdUsuario     = request.IdUsuario,
            IdZona        = request.IdZona,
            TipoIncidente = request.TipoIncidente,
            Descripcion   = request.Descripcion,
            Estado        = "Activo",
            FechaReporte  = DateTime.Now
        };

        _context.Incidentes.Add(incidente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerIncidente), new { id = incidente.IdIncidente }, new
        {
            idIncidente   = incidente.IdIncidente,
            idUsuario     = incidente.IdUsuario,
            idZona        = incidente.IdZona,
            tipoIncidente = incidente.TipoIncidente,
            estado        = incidente.Estado,
            fechaReporte  = incidente.FechaReporte,
            mensaje       = "Incidente creado exitosamente."
        });
    }

    // GET api/incidents/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerIncidente(int id)
    {
        var i = await _context.Incidentes.Include(x => x.Zona).FirstOrDefaultAsync(x => x.IdIncidente == id);
        if (i == null) return NotFound();
        return Ok(new
        {
            idIncidente   = i.IdIncidente,
            idUsuario     = i.IdUsuario,
            zona          = i.Zona.Nombre,
            tipoIncidente = i.TipoIncidente,
            descripcion   = i.Descripcion,
            estado        = i.Estado,
            fechaReporte  = i.FechaReporte
        });
    }

    // GET api/incidents — listar todos
    [HttpGet]
    public async Task<IActionResult> ListarIncidentes()
    {
        var lista = await _context.Incidentes
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

        return Ok(lista);
    }
}

// DTO inline para no necesitar carpeta DTOs por ahora
public class CrearIncidenteDto
{
    public int IdUsuario { get; set; }
    public int IdZona { get; set; }
    public string TipoIncidente { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}
