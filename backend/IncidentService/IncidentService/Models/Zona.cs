using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IncidentService.Models;

public class Zona
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdZona { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Descripcion { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,7)")]
    public decimal Latitud { get; set; }

    [Required]
    [Column(TypeName = "decimal(10,7)")]
    public decimal Longitud { get; set; }

    public string? CoordenadasPoligono { get; set; }

    public bool Activa { get; set; } = true;

    // Navegación
    public ICollection<Incidente> Incidentes { get; set; } = new List<Incidente>();
}
