using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IncidentService.Models;

public class ReporteGuardia
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdReporte { get; set; }

    /// <summary>Número legible auto-generado: RPT-AAAAMM-NNNN</summary>
    [Required]
    [MaxLength(20)]
    public string NumeroReporte { get; set; } = string.Empty;

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

    /// <summary>"Novedad", "Incidente", "Observación"</summary>
    [Required]
    [MaxLength(50)]
    public string TipoReporte { get; set; } = "Novedad";

    /// <summary>"Baja", "Media", "Alta", "Urgente"</summary>
    [Required]
    [MaxLength(20)]
    public string Prioridad { get; set; } = "Media";

    public int? IdZona { get; set; }

    [Column(TypeName = "decimal(10,7)")]
    public decimal? Latitud { get; set; }

    [Column(TypeName = "decimal(10,7)")]
    public decimal? Longitud { get; set; }

    /// <summary>Hora exacta del suceso reportado</summary>
    public DateTime HoraIncidente { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    /// <summary>"Enviado", "Leído", "Resuelto"</summary>
    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = "Enviado";

    // Navegación
    [ForeignKey("IdTurno")]
    public Turno? Turno { get; set; }

    [ForeignKey("IdZona")]
    public Zona? Zona { get; set; }
}
