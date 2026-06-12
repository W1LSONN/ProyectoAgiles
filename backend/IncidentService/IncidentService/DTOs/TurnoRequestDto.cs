using System.ComponentModel.DataAnnotations;

namespace IncidentService.DTOs;

public class CrearTurnoRequest
{
    [Required]
    [MaxLength(50)]
    public string NombreTurno { get; set; } = string.Empty;

    [Required]
    public TimeSpan HoraInicio { get; set; }

    [Required]
    public TimeSpan HoraFin { get; set; }

    public int IdGuardia { get; set; }

    [MaxLength(100)]
    public string NombreGuardia { get; set; } = string.Empty;

    [MaxLength(20)]
    public string DiaSemana { get; set; } = "Todos";
}

public class EditarTurnoRequest
{
    [MaxLength(50)]
    public string? NombreTurno { get; set; }

    public TimeSpan? HoraInicio { get; set; }
    public TimeSpan? HoraFin { get; set; }
    public int? IdGuardia { get; set; }

    [MaxLength(100)]
    public string? NombreGuardia { get; set; }

    [MaxLength(20)]
    public string? DiaSemana { get; set; }

    public bool? Activo { get; set; }
}
