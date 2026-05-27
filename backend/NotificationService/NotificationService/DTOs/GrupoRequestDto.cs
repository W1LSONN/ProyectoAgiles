using System.ComponentModel.DataAnnotations;

namespace NotificationService.DTOs;

public class GrupoRequestDto
{
    [Required(ErrorMessage = "El nombre del grupo es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(255, ErrorMessage = "La descripción no puede superar los 255 caracteres.")]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "El ID del creador es obligatorio.")]
    public int IdCreador { get; set; }
}
