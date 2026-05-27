using Microsoft.EntityFrameworkCore;
using IncidentService.Models;

namespace IncidentService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Zona> Zonas { get; set; }
    public DbSet<Incidente> Incidentes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Seed data — Zonas del campus UTA
        modelBuilder.Entity<Zona>().HasData(
            new Zona { IdZona = 1, Nombre = "Zona 1 — Arquitectura / Humanidades", Descripcion = "Facultad de Arquitectura y Humanidades", Latitud = -1.2491m, Longitud = -78.6167m, Activa = true },
            new Zona { IdZona = 2, Nombre = "Zona 2 — Administración", Descripcion = "Facultad de Ciencias Administrativas", Latitud = -1.2498m, Longitud = -78.6172m, Activa = true },
            new Zona { IdZona = 3, Nombre = "Zona 3 — Ciencias de la Salud", Descripcion = "Facultad de Ciencias de la Salud", Latitud = -1.2485m, Longitud = -78.6180m, Activa = true },
            new Zona { IdZona = 4, Nombre = "Zona 4 — Ingeniería / FCI", Descripcion = "Facultad de Ingeniería y FCI", Latitud = -1.2502m, Longitud = -78.6162m, Activa = true }
        );
    }
}
