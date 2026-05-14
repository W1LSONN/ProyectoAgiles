using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AuthService.Migrations
{
    /// <inheritdoc />
    public partial class AddEstudiantesSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "IdUsuario", "ContrasenaHash", "Correo", "Disponible", "Estado", "Facultad", "FechaRegistro", "IdRol", "Nombre" },
                values: new object[,]
                {
                    { 6, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante1@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 1" },
                    { 7, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante2@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 2" },
                    { 8, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante3@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 3" },
                    { 9, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante4@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 4" },
                    { 10, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante5@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 5" },
                    { 11, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante6@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 6" },
                    { 12, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante7@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 7" },
                    { 13, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante8@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 8" },
                    { 14, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante9@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 9" },
                    { 15, "$2a$11$CLFV2MnHCrdx1a5kgYlOcOrKgq.UpTtg3IXWtLEiOUxEa2qq0eKpW", "estudiante10@uta.edu.ec", true, "Activo", "FISEI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), 3, "Estudiante 10" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "IdUsuario",
                keyValue: 15);
        }
    }
}
