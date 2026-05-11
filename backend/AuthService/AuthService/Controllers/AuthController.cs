using AuthService.Data;
using AuthService.Models;
using AuthService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;

    public AuthController(AppDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Buscar usuario por correo
        var usuario = await _context.Usuarios
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.Correo == request.Correo
                                   && u.Estado == "Activo");

        if (usuario == null)
            return Unauthorized(new { mensaje = "Credenciales incorrectas" });

        // Verificar contraseña
        bool passwordValido = BCrypt.Net.BCrypt.Verify(request.Contrasena,
                                                        usuario.ContrasenaHash);
        if (!passwordValido)
            return Unauthorized(new { mensaje = "Credenciales incorrectas" });

        // Generar token
        var token = _jwtService.GenerarToken(usuario, usuario.Rol.NombreRol);

        return Ok(new LoginResponse
        {
            IdUsuario = usuario.IdUsuario,
            Token = token,
            Nombre = usuario.Nombre,
            Correo = usuario.Correo,
            Rol = usuario.Rol.NombreRol,
            Facultad = usuario.Facultad
        });
    }
}
