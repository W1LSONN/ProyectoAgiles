using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotificationService.Data;
using NotificationService.DTOs;
using NotificationService.Models;

namespace NotificationService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GruposController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<GruposController> _logger;

    public GruposController(AppDbContext context, ILogger<GruposController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> ListarGrupos([FromQuery] int? idCreador)
    {
        var query = _context.GruposConfianza.Include(g => g.Miembros).AsQueryable();

        if (idCreador.HasValue)
        {
            query = query.Where(g => g.IdCreador == idCreador.Value);
        }

        var grupos = await query.Select(g => new {
            idGrupo = g.IdGrupo,
            nombre = g.Nombre,
            descripcion = g.Descripcion,
            idCreador = g.IdCreador,
            fechaCreacion = g.FechaCreacion,
            cantidadMiembros = g.Miembros.Count,
            miembros = g.Miembros.Select(m => new {
                idUsuarioGrupo = m.IdUsuarioGrupo,
                idUsuario = m.IdUsuario,
                fechaUnion = m.FechaUnion
            }).ToList()
        }).ToListAsync();

        return Ok(grupos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerGrupo(int id)
    {
        var grupo = await _context.GruposConfianza
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.IdGrupo == id);

        if (grupo == null)
        {
            return NotFound(new { mensaje = $"Grupo con ID {id} no encontrado." });
        }

        return Ok(new {
            idGrupo = grupo.IdGrupo,
            nombre = grupo.Nombre,
            descripcion = grupo.Descripcion,
            idCreador = grupo.IdCreador,
            fechaCreacion = grupo.FechaCreacion,
            miembros = grupo.Miembros.Select(m => new {
                idUsuarioGrupo = m.IdUsuarioGrupo,
                idUsuario = m.IdUsuario,
                fechaUnion = m.FechaUnion
            }).ToList()
        });
    }

    [HttpPost]
    public async Task<IActionResult> CrearGrupo([FromBody] GrupoRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var nuevoGrupo = new GrupoConfianza
            {
                Nombre = request.Nombre,
                Descripcion = request.Descripcion,
                IdCreador = request.IdCreador,
                FechaCreacion = DateTime.Now
            };

            _context.GruposConfianza.Add(nuevoGrupo);
            await _context.SaveChangesAsync();

            // Auto-agregar al creador como miembro del grupo
            var miembroCreador = new UsuarioGrupo
            {
                IdUsuario = request.IdCreador,
                IdGrupo = nuevoGrupo.IdGrupo,
                FechaUnion = DateTime.Now
            };

            _context.UsuarioGrupos.Add(miembroCreador);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            _logger.LogInformation("Grupo de confianza creado: ID={IdGrupo}, Creador={IdCreador}", nuevoGrupo.IdGrupo, nuevoGrupo.IdCreador);

            return CreatedAtAction(nameof(ObtenerGrupo), new { id = nuevoGrupo.IdGrupo }, new {
                idGrupo = nuevoGrupo.IdGrupo,
                nombre = nuevoGrupo.Nombre,
                descripcion = nuevoGrupo.Descripcion,
                idCreador = nuevoGrupo.IdCreador,
                fechaCreacion = nuevoGrupo.FechaCreacion
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error al crear el grupo de confianza.");
            return StatusCode(500, new { mensaje = "Ocurrió un error al crear el grupo de confianza.", detalle = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarGrupo(int id, [FromBody] GrupoRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var grupo = await _context.GruposConfianza.FindAsync(id);
        if (grupo == null)
        {
            return NotFound(new { mensaje = $"Grupo con ID {id} no encontrado." });
        }

        grupo.Nombre = request.Nombre;
        grupo.Descripcion = request.Descripcion;
        grupo.IdCreador = request.IdCreador;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Grupo de confianza actualizado: ID={IdGrupo}", id);

        return Ok(grupo);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarGrupo(int id)
    {
        var grupo = await _context.GruposConfianza.Include(g => g.Miembros).FirstOrDefaultAsync(g => g.IdGrupo == id);
        if (grupo == null)
        {
            return NotFound(new { mensaje = $"Grupo con ID {id} no encontrado." });
        }

        _context.UsuarioGrupos.RemoveRange(grupo.Miembros);
        _context.GruposConfianza.Remove(grupo);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Grupo de confianza eliminado: ID={IdGrupo}", id);

        return Ok(new { mensaje = "Grupo de confianza y sus miembros eliminados exitosamente." });
    }

    // ── GESTIÓN DE MIEMBROS ──

    [HttpPost("{id}/miembros")]
    public async Task<IActionResult> AgregarMiembro(int id, [FromBody] MiembroRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var grupo = await _context.GruposConfianza.AnyAsync(g => g.IdGrupo == id);
        if (!grupo)
        {
            return NotFound(new { mensaje = $"Grupo con ID {id} no existe." });
        }

        var yaEsMiembro = await _context.UsuarioGrupos.AnyAsync(ug => ug.IdGrupo == id && ug.IdUsuario == request.IdUsuario);
        if (yaEsMiembro)
        {
            return BadRequest(new { mensaje = "El usuario ya es miembro de este grupo." });
        }

        var nuevoMiembro = new UsuarioGrupo
        {
            IdGrupo = id,
            IdUsuario = request.IdUsuario,
            FechaUnion = DateTime.Now
        };

        _context.UsuarioGrupos.Add(nuevoMiembro);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Miembro {IdUsuario} agregado al grupo {IdGrupo}", request.IdUsuario, id);

        return Ok(new {
            idUsuarioGrupo = nuevoMiembro.IdUsuarioGrupo,
            idGrupo = nuevoMiembro.IdGrupo,
            idUsuario = nuevoMiembro.IdUsuario,
            fechaUnion = nuevoMiembro.FechaUnion,
            mensaje = "Miembro agregado con éxito."
        });
    }

    [HttpDelete("{id}/miembros/{idUsuario}")]
    public async Task<IActionResult> EliminarMiembro(int id, int idUsuario)
    {
        var miembro = await _context.UsuarioGrupos.FirstOrDefaultAsync(ug => ug.IdGrupo == id && ug.IdUsuario == idUsuario);
        if (miembro == null)
        {
            return NotFound(new { mensaje = "El usuario no es miembro de este grupo." });
        }

        _context.UsuarioGrupos.Remove(miembro);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Miembro {IdUsuario} removido del grupo {IdGrupo}", idUsuario, id);

        return Ok(new { mensaje = "Miembro eliminado con éxito." });
    }
}
