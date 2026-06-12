using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NotificationService.Migrations
{
    /// <inheritdoc />
    public partial class AddSolicitudesGrupo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SolicitudesGrupo",
                columns: table => new
                {
                    IdSolicitud = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdGrupo = table.Column<int>(type: "int", nullable: false),
                    IdUsuarioSolicitante = table.Column<int>(type: "int", nullable: false),
                    IdUsuarioDestinatario = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FechaSolicitud = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaRespuesta = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudesGrupo", x => x.IdSolicitud);
                    table.ForeignKey(
                        name: "FK_SolicitudesGrupo_GruposConfianza_IdGrupo",
                        column: x => x.IdGrupo,
                        principalTable: "GruposConfianza",
                        principalColumn: "IdGrupo",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesGrupo_IdGrupo_IdUsuarioSolicitante_IdUsuarioDestinatario_Estado",
                table: "SolicitudesGrupo",
                columns: new[] { "IdGrupo", "IdUsuarioSolicitante", "IdUsuarioDestinatario", "Estado" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SolicitudesGrupo");
        }
    }
}
