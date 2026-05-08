using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Models;

public class Usuario
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdUsuario { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string ContrasenaHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Facultad { get; set; }

    public int IdRol { get; set; }

    public bool Disponible { get; set; } = true;

    [MaxLength(20)]
    public string Estado { get; set; } = "Activo";

    public DateTime FechaRegistro { get; set; } = DateTime.Now;

    // Navegación
    [ForeignKey("IdRol")]
    public Rol Rol { get; set; } = null!;
}
