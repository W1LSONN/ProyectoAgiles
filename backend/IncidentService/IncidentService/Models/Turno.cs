using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IncidentService.Models;

public class Turno
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdTurno { get; set; }

    [Required]
    [MaxLength(50)]
    public string NombreTurno { get; set; } = string.Empty;

    [Required]
    public TimeSpan HoraInicio { get; set; }

    [Required]
    public TimeSpan HoraFin { get; set; }

    /// <summary>FK al usuario guardia (AuthService). 0 = sin asignar.</summary>
    public int IdGuardia { get; set; }

    [MaxLength(100)]
    public string NombreGuardia { get; set; } = string.Empty;

    /// <summary>"Lunes","Martes",…,"Domingo" o "Todos"</summary>
    [MaxLength(20)]
    public string DiaSemana { get; set; } = "Todos";

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    // Navegación
    public ICollection<ReporteGuardia> Reportes { get; set; } = new List<ReporteGuardia>();
}
