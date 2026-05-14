using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IncidentService.Models;

public class Incidente
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdIncidente { get; set; }

    [Required]
    public int IdUsuario { get; set; }

    [Required]
    public int IdZona { get; set; }

    [Required]
    [MaxLength(100)]
    public string TipoIncidente { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Activo";

    [MaxLength(500)]
    public string? ObservacionesCierre { get; set; }

    public DateTime FechaReporte { get; set; } = DateTime.Now;

    public DateTime? FechaCierre { get; set; }

    // Navegación
    [ForeignKey("IdZona")]
    public Zona Zona { get; set; } = null!;
}
