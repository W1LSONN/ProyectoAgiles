using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IncidentService.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidentCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Latitud",
                table: "Incidentes",
                type: "decimal(10,7)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitud",
                table: "Incidentes",
                type: "decimal(10,7)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitud",
                table: "Incidentes");

            migrationBuilder.DropColumn(
                name: "Longitud",
                table: "Incidentes");
        }
    }
}
