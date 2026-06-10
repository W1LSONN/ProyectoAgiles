using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuthService.Data;
using AuthService.Models;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsuariosController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/usuarios  –  listar todos con su rol
    [HttpGet]
    public async Task<IActionResult> ListarUsuarios()
    {
        var usuarios = await _context.Usuarios
            .Include(u => u.Rol)
            .OrderBy(u => u.IdUsuario)
            .Select(u => new
            {
                idUsuario   = u.IdUsuario,
                nombre      = u.Nombre,
                correo      = u.Correo,
                facultad    = u.Facultad,
                rol         = u.Rol.NombreRol,
                estado      = u.Estado,
                disponible  = u.Disponible,
                fechaRegistro = u.FechaRegistro
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    // GET /api/usuarios/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerUsuario(int id)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .Where(u => u.IdUsuario == id)
            .Select(u => new
            {
                idUsuario  = u.IdUsuario,
                nombre     = u.Nombre,
                correo     = u.Correo,
                facultad   = u.Facultad,
                rol        = u.Rol.NombreRol,
                estado     = u.Estado,
                disponible = u.Disponible,
                fechaRegistro = u.FechaRegistro
            })
            .FirstOrDefaultAsync();

        if (usuario == null)
            return NotFound(new { mensaje = "Usuario no encontrado" });

        return Ok(usuario);
    }

    // PUT /api/usuarios/{id}/estado  –  activar / desactivar usuario
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoRequest request)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null)
            return NotFound(new { mensaje = "Usuario no encontrado" });

        usuario.Estado = request.Estado; // "Activo" | "Inactivo"
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = $"Usuario {usuario.Nombre} ahora está {usuario.Estado}." });
    }
}

public record CambiarEstadoRequest(string Estado);