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
    public DbSet<Turno> Turnos { get; set; }
    public DbSet<ReporteGuardia> ReportesGuardia { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Seed data — Zonas del campus UTA
        modelBuilder.Entity<Zona>().HasData(
            new Zona { IdZona = 1, Nombre = "Zona 1 — Arquitectura / Humanidades", Descripcion = "Facultad de Arquitectura y Humanidades", Latitud = -1.2674m, Longitud = -78.6248m, Activa = true },
            new Zona { IdZona = 2, Nombre = "Zona 2 — Administración", Descripcion = "Facultad de Ciencias Administrativas", Latitud = -1.2697m, Longitud = -78.6233m, Activa = true },
            new Zona { IdZona = 3, Nombre = "Zona 3 — Ciencias de la Salud", Descripcion = "Facultad de Ciencias de la Salud", Latitud = -1.2676m, Longitud = -78.6235m, Activa = true },
            new Zona { IdZona = 4, Nombre = "Zona 4 — Ingeniería / FCI", Descripcion = "Facultad de Ingeniería y FCI", Latitud = -1.2695m, Longitud = -78.6251m, Activa = true }
        );

        // Seed data — Cámaras de seguridad
        modelBuilder.Entity<Camara>().HasData(
            new Camara { IdCamara = 1, Nombre = "Cámara Entrada Principal", Latitud = -1.2674m, Longitud = -78.6248m, UrlStream = "https://www.w3schools.com/html/mov_bbb.mp4", Estado = "Activa", IdZona = 1 },
            new Camara { IdCamara = 2, Nombre = "Cámara Admin Externa", Latitud = -1.2697m, Longitud = -78.6233m, UrlStream = "https://www.w3schools.com/html/movie.mp4", Estado = "Activa", IdZona = 2 },
            new Camara { IdCamara = 3, Nombre = "Cámara Salud Interna", Latitud = -1.2676m, Longitud = -78.6235m, UrlStream = "https://www.w3schools.com/html/mov_bbb.mp4", Estado = "Mantenimiento", IdZona = 3 },
            new Camara { IdCamara = 4, Nombre = "Cámara Lab FCI", Latitud = -1.2695m, Longitud = -78.6251m, UrlStream = "https://www.w3schools.com/html/movie.mp4", Estado = "Activa", IdZona = 4 }
        );

        // Seed data — Turnos por defecto
        modelBuilder.Entity<Turno>().HasData(
            new Turno { IdTurno = 1, NombreTurno = "Turno Mañana", HoraInicio = new TimeSpan(7, 0, 0), HoraFin = new TimeSpan(13, 0, 0), IdGuardia = 0, NombreGuardia = "", DiaSemana = "Todos", Activo = true, FechaCreacion = new DateTime(2026, 1, 1) },
            new Turno { IdTurno = 2, NombreTurno = "Turno Tarde", HoraInicio = new TimeSpan(13, 0, 0), HoraFin = new TimeSpan(19, 0, 0), IdGuardia = 0, NombreGuardia = "", DiaSemana = "Todos", Activo = true, FechaCreacion = new DateTime(2026, 1, 1) },
            new Turno { IdTurno = 3, NombreTurno = "Turno Noche", HoraInicio = new TimeSpan(19, 0, 0), HoraFin = new TimeSpan(7, 0, 0), IdGuardia = 0, NombreGuardia = "", DiaSemana = "Todos", Activo = true, FechaCreacion = new DateTime(2026, 1, 1) }
        );
    }
}
