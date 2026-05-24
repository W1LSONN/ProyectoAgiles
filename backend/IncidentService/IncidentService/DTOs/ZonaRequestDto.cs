using System.ComponentModel.DataAnnotations;

namespace IncidentService.DTOs;

public class ZonaRequestDto
{
    [Required(ErrorMessage = "El nombre de la zona es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(255, ErrorMessage = "La descripción no puede superar los 255 caracteres.")]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La latitud es obligatoria.")]
    public decimal Latitud { get; set; }

    [Required(ErrorMessage = "La longitud es obligatoria.")]
    public decimal Longitud { get; set; }

    public string? CoordenadasPoligono { get; set; }

    public bool Activa { get; set; } = true;
}
