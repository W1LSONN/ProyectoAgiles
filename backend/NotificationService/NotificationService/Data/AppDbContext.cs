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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Restricción UNIQUE en UsuarioGrupo
        modelBuilder.Entity<UsuarioGrupo>()
            .HasIndex(ug => new { ug.IdUsuario, ug.IdGrupo })
            .IsUnique();
    }
}
