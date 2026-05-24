using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IncidentService.Migrations
{
    /// <inheritdoc />
    public partial class AddCamarasTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Camaras",
                columns: table => new
                {
                    IdCamara = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Latitud = table.Column<decimal>(type: "decimal(10,7)", nullable: false),
                    Longitud = table.Column<decimal>(type: "decimal(10,7)", nullable: false),
                    UrlStream = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IdZona = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Camaras", x => x.IdCamara);
                    table.ForeignKey(
                        name: "FK_Camaras_Zonas_IdZona",
                        column: x => x.IdZona,
                        principalTable: "Zonas",
                        principalColumn: "IdZona");
                });

            migrationBuilder.InsertData(
                table: "Camaras",
                columns: new[] { "IdCamara", "Estado", "IdZona", "Latitud", "Longitud", "Nombre", "UrlStream" },
                values: new object[,]
                {
                    { 1, "Activa", 1, -1.2490m, -78.6166m, "Cámara Entrada Principal", "https://www.w3schools.com/html/mov_bbb.mp4" },
                    { 2, "Activa", 2, -1.2497m, -78.6170m, "Cámara Admin Externa", "https://www.w3schools.com/html/movie.mp4" },
                    { 3, "Mantenimiento", 3, -1.2486m, -78.6181m, "Cámara Salud Interna", "https://www.w3schools.com/html/mov_bbb.mp4" },
                    { 4, "Activa", 4, -1.2503m, -78.6160m, "Cámara Lab FCI", "https://www.w3schools.com/html/movie.mp4" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Camaras_IdZona",
                table: "Camaras",
                column: "IdZona");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Camaras");
        }
    }
}
