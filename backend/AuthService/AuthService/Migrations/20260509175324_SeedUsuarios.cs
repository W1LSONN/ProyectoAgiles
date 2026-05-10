using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AuthService.Migrations
{
    /// <inheritdoc />
    public partial class SeedUsuarios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "IdUsuario", "ContrasenaHash", "Correo", "Disponible", "Estado", "Facultad", "FechaRegistro", "IdRol", "Nombre" },
                values: new object[,]
                {
                    { 1, "$2a$11$cN//UnlEIFmdlC6q6mZuOu42CKP3irBnaMtI8ZqAIMIxWFLNb8OZ.", "admin@uta.edu.ec", true, "Activo", "Administración Central", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 1, "Administrador UTA" },
                    { 2, "$2a$11$v/3L5JzIPWvSuVmL/VQoEOqX1BKSxdwwSVtd5CNd.doJXl2EqHDri", "guardia1@uta.edu.ec", true, "Activo", "Seguridad UTA", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 2, "Carlos Guardia" },
                    { 3, "$2a$11$v/3L5JzIPWvSuVmL/VQoEOqX1BKSxdwwSVtd5CNd.doJXl2EqHDri", "guardia2@uta.edu.ec", false, "Activo", "Seguridad UTA", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 2, "Pedro Guardia" },
                    { 4, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "wilson@uta.edu.ec", true, "Activo", "Facultad de Ingeniería en Sistemas", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Wilson Pillapa" },
                    { 5, "$2a$11$ylhM/4w1dLl.mIqVydpR2OmB8/Jw7VWlLuDkA4eKcNLNC7rTvE5c2", "docente@uta.edu.ec", true, "Activo", "Facultad de Ingeniería en Sistemas", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 4, "Juan Docente" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 5);
        }
    }
}
