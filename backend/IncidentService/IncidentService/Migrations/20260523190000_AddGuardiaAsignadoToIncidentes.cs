using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IncidentService.Migrations
{
    /// <inheritdoc />
    public partial class AddGuardiaAsignadoToIncidentes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GuardiaAsignado",
                table: "Incidentes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuardiaAsignado",
                table: "Incidentes");
        }
    }
}