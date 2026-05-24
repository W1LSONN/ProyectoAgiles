using System.ComponentModel.DataAnnotations;

namespace NotificationService.DTOs;

public class MiembroRequestDto
{
    [Required(ErrorMessage = "El ID del usuario es obligatorio.")]
    public int IdUsuario { get; set; }
}
