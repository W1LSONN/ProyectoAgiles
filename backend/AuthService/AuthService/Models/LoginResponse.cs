namespace AuthService.Models;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string? Facultad { get; set; }
}
