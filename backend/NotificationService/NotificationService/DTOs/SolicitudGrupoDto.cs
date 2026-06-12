using System.ComponentModel.DataAnnotations;

namespace NotificationService.DTOs;

public class CrearSolicitudDto
{
    [Required]
    public int IdGrupo { get; set; }

    [Required]
    public int IdUsuarioSolicitante { get; set; }

    [Required]
    public int IdUsuarioDestinatario { get; set; }
}

public class ResponderSolicitudDto
{
    /// <summary>Debe ser "Aceptada" o "Rechazada"</summary>
    [Required]
    [RegularExpression("^(Aceptada|Rechazada)$", ErrorMessage = "El estado debe ser 'Aceptada' o 'Rechazada'.")]
    public string Estado { get; set; } = string.Empty;
}
