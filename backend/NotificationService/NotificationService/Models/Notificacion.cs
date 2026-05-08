using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NotificationService.Models;

public class Notificacion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdNotificacion { get; set; }

    [Required]
    public int IdIncidente { get; set; }

    [Required]
    public int IdReceptor { get; set; }

    [Required]
    [MaxLength(20)]
    public string TipoReceptor { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Mensaje { get; set; } = string.Empty;

    public bool Leida { get; set; } = false;

    public DateTime FechaEnvio { get; set; } = DateTime.Now;
}
