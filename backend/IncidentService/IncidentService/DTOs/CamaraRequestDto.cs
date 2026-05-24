using System.ComponentModel.DataAnnotations;

namespace IncidentService.DTOs;

public class CamaraRequestDto
{
    [Required(ErrorMessage = "El nombre de la cámara es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "La latitud es obligatoria.")]
    public decimal Latitud { get; set; }

    [Required(ErrorMessage = "La longitud es obligatoria.")]
    public decimal Longitud { get; set; }

    [MaxLength(255, ErrorMessage = "La URL del stream no puede superar los 255 caracteres.")]
    public string? UrlStream { get; set; }

    [MaxLength(50, ErrorMessage = "El estado no puede superar los 50 caracteres.")]
    public string Estado { get; set; } = "Activa";

    public int? IdZona { get; set; }
}
