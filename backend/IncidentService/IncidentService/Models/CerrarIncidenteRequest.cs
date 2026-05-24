using System.ComponentModel.DataAnnotations;

namespace IncidentService.Models;

public class CerrarIncidenteRequest
{
    [Required(ErrorMessage = "Las observaciones son obligatorias para cerrar un incidente.")]
    [MaxLength(500)]
    public string Observaciones { get; set; } = string.Empty;
}