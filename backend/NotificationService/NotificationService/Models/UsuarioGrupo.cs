using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NotificationService.Models;

public class UsuarioGrupo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdUsuarioGrupo { get; set; }

    [Required]
    public int IdUsuario { get; set; }

    [Required]
    public int IdGrupo { get; set; }

    public DateTime FechaUnion { get; set; } = DateTime.Now;

    // Navegación
    [ForeignKey("IdGrupo")]
    public GrupoConfianza GrupoConfianza { get; set; } = null!;
}
