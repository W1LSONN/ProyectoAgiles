using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NotificationService.Models;

public class SolicitudGrupo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdSolicitud { get; set; }

    [Required]
    public int IdGrupo { get; set; }

    /// <summary>Usuario que ENVÍA la solicitud (remitente)</summary>
    [Required]
    public int IdUsuarioSolicitante { get; set; }

    /// <summary>Usuario que RECIBE la solicitud (destinatario)</summary>
    [Required]
    public int IdUsuarioDestinatario { get; set; }

    /// <summary>Pendiente | Aceptada | Rechazada</summary>
    [MaxLength(20)]
    public string Estado { get; set; } = "Pendiente";

    public DateTime FechaSolicitud { get; set; } = DateTime.Now;

    public DateTime? FechaRespuesta { get; set; }

    // Navegación
    [ForeignKey("IdGrupo")]
    public GrupoConfianza Grupo { get; set; } = null!;
}
