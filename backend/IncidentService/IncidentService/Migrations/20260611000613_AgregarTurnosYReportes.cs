using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IncidentService.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTurnosYReportes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Turnos",
                columns: table => new
                {
                    IdTurno = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreTurno = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HoraInicio = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraFin = table.Column<TimeSpan>(type: "time", nullable: false),
                    IdGuardia = table.Column<int>(type: "int", nullable: false),
                    NombreGuardia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DiaSemana = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Turnos", x => x.IdTurno);
                });

            migrationBuilder.CreateTable(
                name: "ReportesGuardia",
                columns: table => new
                {
                    IdReporte = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumeroReporte = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IdGuardia = table.Column<int>(type: "int", nullable: false),
                    NombreGuardia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IdTurno = table.Column<int>(type: "int", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    TipoReporte = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Prioridad = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IdZona = table.Column<int>(type: "int", nullable: true),
                    Latitud = table.Column<decimal>(type: "decimal(10,7)", nullable: true),
                    Longitud = table.Column<decimal>(type: "decimal(10,7)", nullable: true),
                    HoraIncidente = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportesGuardia", x => x.IdReporte);
                    table.ForeignKey(
                        name: "FK_ReportesGuardia_Turnos_IdTurno",
                        column: x => x.IdTurno,
                        principalTable: "Turnos",
                        principalColumn: "IdTurno");
                    table.ForeignKey(
                        name: "FK_ReportesGuardia_Zonas_IdZona",
                        column: x => x.IdZona,
                        principalTable: "Zonas",
                        principalColumn: "IdZona");
                });

            migrationBuilder.InsertData(
                table: "Turnos",
                columns: new[] { "IdTurno", "Activo", "DiaSemana", "FechaCreacion", "HoraFin", "HoraInicio", "IdGuardia", "NombreGuardia", "NombreTurno" },
                values: new object[,]
                {
                    { 1, true, "Todos", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 13, 0, 0, 0), new TimeSpan(0, 7, 0, 0, 0), 0, "", "Turno Mañana" },
                    { 2, true, "Todos", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 19, 0, 0, 0), new TimeSpan(0, 13, 0, 0, 0), 0, "", "Turno Tarde" },
                    { 3, true, "Todos", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 7, 0, 0, 0), new TimeSpan(0, 19, 0, 0, 0), 0, "", "Turno Noche" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReportesGuardia_IdTurno",
                table: "ReportesGuardia",
                column: "IdTurno");

            migrationBuilder.CreateIndex(
                name: "IX_ReportesGuardia_IdZona",
                table: "ReportesGuardia",
                column: "IdZona");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReportesGuardia");

            migrationBuilder.DropTable(
                name: "Turnos");
        }
    }
}
