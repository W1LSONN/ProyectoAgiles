using System.ComponentModel.DataAnnotations;

namespace IncidentService.DTOs;

/// <summary>
/// Datos para marcar un incidente como asumido por un guardia.
/// </summary>
public class AsumirIncidenteRequest
{
    [Required(ErrorMessage = "El campo GuardiaAsignado es obligatorio.")]
    [MaxLength(100, ErrorMessage = "GuardiaAsignado no puede exceder 100 caracteres.")]
    public string GuardiaAsignado { get; set; } = string.Empty;
}