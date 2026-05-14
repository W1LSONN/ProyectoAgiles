using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public static class UsuarioSeeder
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>().HasData(
            // Admin
            new Usuario
            {
                IdUsuario = 1,
                Nombre = "Administrador UTA",
                Correo = "admin@uta.edu.ec",
                ContrasenaHash = "$2a$11$cN//UnlEIFmdlC6q6mZuOu42CKP3irBnaMtI8ZqAIMIxWFLNb8OZ.",
                Facultad = "Administración Central",
                IdRol = 1,
                Disponible = true,
                Estado = "Activo",
                FechaRegistro = new DateTime(2026, 1, 1)
            },
            // Guardia 1
            new Usuario
            {
                IdUsuario = 2,
                Nombre = "Carlos Guardia",
                Correo = "guardia1@uta.edu.ec",
                ContrasenaHash = "$2a$11$v/3L5JzIPWvSuVmL/VQoEOqX1BKSxdwwSVtd5CNd.doJXl2EqHDri",
                Facultad = "Seguridad UTA",
                IdRol = 2,
                Disponible = true,
                Estado = "Activo",
                FechaRegistro = new DateTime(2026, 1, 1)
            },
            // Guardia 2
            new Usuario
            {
                IdUsuario = 3,
                Nombre = "Pedro Guardia",
                Correo = "guardia2@uta.edu.ec",
                ContrasenaHash = "$2a$11$v/3L5JzIPWvSuVmL/VQoEOqX1BKSxdwwSVtd5CNd.doJXl2EqHDri",
                Facultad = "Seguridad UTA",
                IdRol = 2,
                Disponible = false,
                Estado = "Activo",
                FechaRegistro = new DateTime(2026, 1, 1)
            },
            // Estudiante
            new Usuario
            {
                IdUsuario = 4,
                Nombre = "Wilson Pillapa",
                Correo = "wilson@uta.edu.ec",
                ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW",
                Facultad = "Facultad de Ingeniería en Sistemas",
                IdRol = 3,
                Disponible = true,
                Estado = "Activo",
                FechaRegistro = new DateTime(2026, 1, 1)
            },
            // Docente
            new Usuario
            {
                IdUsuario = 5,
                Nombre = "Juan Docente",
                Correo = "docente@uta.edu.ec",
                ContrasenaHash = "$2a$11$ylhM/4w1dLl.mIqVydpR2OmB8/Jw7VWlLuDkA4eKcNLNC7rTvE5c2",
                Facultad = "Facultad de Ingeniería en Sistemas",
                IdRol = 4,
                Disponible = true,
                Estado = "Activo",
                FechaRegistro = new DateTime(2026, 1, 1)
            },
            new Usuario { IdUsuario = 6, Nombre = "Estudiante 1", Correo = "estudiante1@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 7, Nombre = "Estudiante 2", Correo = "estudiante2@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 8, Nombre = "Estudiante 3", Correo = "estudiante3@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 9, Nombre = "Estudiante 4", Correo = "estudiante4@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 10, Nombre = "Estudiante 5", Correo = "estudiante5@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 11, Nombre = "Estudiante 6", Correo = "estudiante6@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 12, Nombre = "Estudiante 7", Correo = "estudiante7@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 13, Nombre = "Estudiante 8", Correo = "estudiante8@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 14, Nombre = "Estudiante 9", Correo = "estudiante9@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) },
            new Usuario { IdUsuario = 15, Nombre = "Estudiante 10", Correo = "estudiante10@uta.edu.ec", ContrasenaHash = "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", Facultad = "FISEI", IdRol = 3, Disponible = true, Estado = "Activo", FechaRegistro = new DateTime(2026, 1, 1) }
        );
    }
}
