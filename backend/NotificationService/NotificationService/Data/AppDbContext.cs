using Microsoft.EntityFrameworkCore;
using NotificationService.Models;

namespace NotificationService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Notificacion> Notificaciones { get; set; }
    public DbSet<GrupoConfianza> GruposConfianza { get; set; }
    public DbSet<UsuarioGrupo> UsuarioGrupos { get; set; }
    public DbSet<SolicitudGrupo> SolicitudesGrupo { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Restricción UNIQUE en UsuarioGrupo
        modelBuilder.Entity<UsuarioGrupo>()
            .HasIndex(ug => new { ug.IdUsuario, ug.IdGrupo })
            .IsUnique();

        // Restricción UNIQUE en SolicitudGrupo — no permitir solicitudes duplicadas pendientes
        modelBuilder.Entity<SolicitudGrupo>()
            .HasIndex(s => new { s.IdGrupo, s.IdUsuarioSolicitante, s.IdUsuarioDestinatario, s.Estado });
    }
}
