using System.ComponentModel.DataAnnotations;

namespace IncidentService.DTOs;

/// <summary>
/// Datos que el cliente (app móvil) envía para reportar un incidente.
/// </summary>
public class CrearIncidenteRequest
{
    [Required(ErrorMessage = "El campo IdUsuario es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "IdUsuario debe ser un número positivo.")]
    public int IdUsuario { get; set; }

    [Required(ErrorMessage = "El campo IdZona es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "IdZona debe ser un número positivo.")]
    public int IdZona { get; set; }

    [Required(ErrorMessage = "El campo TipoIncidente es obligatorio.")]
    [MaxLength(100, ErrorMessage = "TipoIncidente no puede exceder 100 caracteres.")]
    public string TipoIncidente { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "La descripción no puede exceder 500 caracteres.")]
    public string? Descripcion { get; set; }

    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
}
