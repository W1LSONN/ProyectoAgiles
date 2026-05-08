using Microsoft.EntityFrameworkCore;
using AuthService.Models;

namespace AuthService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Rol> Roles { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Índice único en correo
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Correo)
            .IsUnique();

        // Índice único en nombre del rol
        modelBuilder.Entity<Rol>()
            .HasIndex(r => r.NombreRol)
            .IsUnique();

        // Seed data — Roles
        modelBuilder.Entity<Rol>().HasData(
            new Rol { IdRol = 1, NombreRol = "Admin", Descripcion = "Administrador del sistema" },
            new Rol { IdRol = 2, NombreRol = "Guardia", Descripcion = "Guardia de seguridad" },
            new Rol { IdRol = 3, NombreRol = "Estudiante", Descripcion = "Estudiante de la UTA" },
            new Rol { IdRol = 4, NombreRol = "Docente", Descripcion = "Docente de la UTA" }
        );
    }
}
