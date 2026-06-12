using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IncidentService.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSeedCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 1,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2674m, -78.6248m });

            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 2,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2697m, -78.6233m });

            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 3,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2676m, -78.6235m });

            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 4,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2695m, -78.6251m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 1,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2674m, -78.6248m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 2,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2697m, -78.6233m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 3,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2676m, -78.6235m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 4,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2695m, -78.6251m });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 1,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2490m, -78.6166m });

            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 2,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2497m, -78.6170m });

            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 3,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2486m, -78.6181m });

            migrationBuilder.UpdateData(
                table: "Camaras",
                keyColumn: "IdCamara",
                keyValue: 4,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2503m, -78.6160m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 1,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2491m, -78.6167m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 2,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2498m, -78.6172m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 3,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2485m, -78.6180m });

            migrationBuilder.UpdateData(
                table: "Zonas",
                keyColumn: "IdZona",
                keyValue: 4,
                columns: new[] { "Latitud", "Longitud" },
                values: new object[] { -1.2502m, -78.6162m });
        }
    }
}
