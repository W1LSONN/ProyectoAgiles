using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IncidentService.Models;

public class Camara
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdCamara { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(10,7)")]
    public decimal Latitud { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,7)")]
    public decimal Longitud { get; set; }

    [MaxLength(255)]
    public string? UrlStream { get; set; }

    [MaxLength(50)]
    public string Estado { get; set; } = "Activa"; // Activa, Inactiva, Mantenimiento

    public int? IdZona { get; set; }

    // Navegación
    [ForeignKey("IdZona")]
    public Zona? Zona { get; set; }
}
