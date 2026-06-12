using System.ComponentModel.DataAnnotations;

namespace IncidentService.DTOs;

public class CrearReporteRequest
{
    [Required]
    public int IdGuardia { get; set; }

    [Required]
    [MaxLength(100)]
    public string NombreGuardia { get; set; } = string.Empty;

    public int? IdTurno { get; set; }

    [Required]
    [MaxLength(150)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Descripcion { get; set; } = string.Empty;

    [MaxLength(50)]
    public string TipoReporte { get; set; } = "Novedad";

    [MaxLength(20)]
    public string Prioridad { get; set; } = "Media";

    public int? IdZona { get; set; }

    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }

    public DateTime? HoraIncidente { get; set; }
}

public class CambiarEstadoReporteRequest
{
    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = string.Empty;
}
