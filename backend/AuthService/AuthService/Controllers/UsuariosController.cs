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

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerUsuario(int id)
    {
        var usuario = await _context.Usuarios
            .Where(u => u.IdUsuario == id)
            .Select(u => new
            {
                idUsuario = u.IdUsuario,
                nombre = u.Nombre,
                facultad = u.Facultad
            })
            .FirstOrDefaultAsync();

        if (usuario == null)
        {
            return NotFound(new { mensaje = "Usuario no encontrado" });
        }

        return Ok(usuario);
    }
}