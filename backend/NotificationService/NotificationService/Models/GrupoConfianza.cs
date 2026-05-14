using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NotificationService.Models;

public class GrupoConfianza
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int IdGrupo { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Descripcion { get; set; }

    [Required]
    public int IdCreador { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    // Navegación
    public ICollection<UsuarioGrupo> Miembros { get; set; } = new List<UsuarioGrupo>();
}
