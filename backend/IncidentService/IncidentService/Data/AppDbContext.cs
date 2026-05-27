using Microsoft.EntityFrameworkCore;
using IncidentService.Models;

namespace IncidentService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<Zona> Zonas { get; set; }
    public DbSet<Incidente> Incidentes { get; set; }
    public DbSet<Camara> Camaras { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Seed data — Zonas del campus UTA
        modelBuilder.Entity<Zona>().HasData(
            new Zona { IdZona = 1, Nombre = "Zona 1 — Arquitectura / Humanidades", Descripcion = "Facultad de Arquitectura y Humanidades", Latitud = -1.2491m, Longitud = -78.6167m, Activa = true },
            new Zona { IdZona = 2, Nombre = "Zona 2 — Administración", Descripcion = "Facultad de Ciencias Administrativas", Latitud = -1.2498m, Longitud = -78.6172m, Activa = true },
            new Zona { IdZona = 3, Nombre = "Zona 3 — Ciencias de la Salud", Descripcion = "Facultad de Ciencias de la Salud", Latitud = -1.2485m, Longitud = -78.6180m, Activa = true },
            new Zona { IdZona = 4, Nombre = "Zona 4 — Ingeniería / FCI", Descripcion = "Facultad de Ingeniería y FCI", Latitud = -1.2502m, Longitud = -78.6162m, Activa = true }
        );

        // Seed data — Cámaras de seguridad
        modelBuilder.Entity<Camara>().HasData(
            new Camara { IdCamara = 1, Nombre = "Cámara Entrada Principal", Latitud = -1.2490m, Longitud = -78.6166m, UrlStream = "https://www.w3schools.com/html/mov_bbb.mp4", Estado = "Activa", IdZona = 1 },
            new Camara { IdCamara = 2, Nombre = "Cámara Admin Externa", Latitud = -1.2497m, Longitud = -78.6170m, UrlStream = "https://www.w3schools.com/html/movie.mp4", Estado = "Activa", IdZona = 2 },
            new Camara { IdCamara = 3, Nombre = "Cámara Salud Interna", Latitud = -1.2486m, Longitud = -78.6181m, UrlStream = "https://www.w3schools.com/html/mov_bbb.mp4", Estado = "Mantenimiento", IdZona = 3 },
            new Camara { IdCamara = 4, Nombre = "Cámara Lab FCI", Latitud = -1.2503m, Longitud = -78.6160m, UrlStream = "https://www.w3schools.com/html/movie.mp4", Estado = "Activa", IdZona = 4 }
        );
    }
}

