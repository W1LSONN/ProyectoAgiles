using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IncidentService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Zonas",
                columns: table => new
                {
                    IdZona = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Latitud = table.Column<decimal>(type: "decimal(10,7)", nullable: false),
                    Longitud = table.Column<decimal>(type: "decimal(10,7)", nullable: false),
                    CoordenadasPoligono = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zonas", x => x.IdZona);
                });

            migrationBuilder.CreateTable(
                name: "Incidentes",
                columns: table => new
                {
                    IdIncidente = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdUsuario = table.Column<int>(type: "int", nullable: false),
                    IdZona = table.Column<int>(type: "int", nullable: false),
                    TipoIncidente = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ObservacionesCierre = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaReporte = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaCierre = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidentes", x => x.IdIncidente);
                    table.ForeignKey(
                        name: "FK_Incidentes_Zonas_IdZona",
                        column: x => x.IdZona,
                        principalTable: "Zonas",
                        principalColumn: "IdZona",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Zonas",
                columns: new[] { "IdZona", "Activa", "CoordenadasPoligono", "Descripcion", "Latitud", "Longitud", "Nombre" },
                values: new object[,]
                {
                    { 1, true, null, "Facultad de Arquitectura y Humanidades", -1.2491m, -78.6167m, "Zona 1 — Arquitectura / Humanidades" },
                    { 2, true, null, "Facultad de Ciencias Administrativas", -1.2498m, -78.6172m, "Zona 2 — Administración" },
                    { 3, true, null, "Facultad de Ciencias de la Salud", -1.2485m, -78.6180m, "Zona 3 — Ciencias de la Salud" },
                    { 4, true, null, "Facultad de Ingeniería y FCI", -1.2502m, -78.6162m, "Zona 4 — Ingeniería / FCI" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Incidentes_IdZona",
                table: "Incidentes",
                column: "IdZona");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Incidentes");

            migrationBuilder.DropTable(
                name: "Zonas");
        }
    }
}
