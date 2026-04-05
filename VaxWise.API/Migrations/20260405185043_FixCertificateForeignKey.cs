using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaxWise.API.Migrations
{
    /// <inheritdoc />
    public partial class FixCertificateForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Certificates_VaccinationEvents_VaccinationEventEventId",
                table: "Certificates");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_VaccinationEventEventId",
                table: "Certificates");

            migrationBuilder.DropColumn(
                name: "VaccinationEventEventId",
                table: "Certificates");

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_EventId",
                table: "Certificates",
                column: "EventId");

            migrationBuilder.AddForeignKey(
                name: "FK_Certificates_VaccinationEvents_EventId",
                table: "Certificates",
                column: "EventId",
                principalTable: "VaccinationEvents",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Certificates_VaccinationEvents_EventId",
                table: "Certificates");

            migrationBuilder.DropIndex(
                name: "IX_Certificates_EventId",
                table: "Certificates");

            migrationBuilder.AddColumn<int>(
                name: "VaccinationEventEventId",
                table: "Certificates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Certificates_VaccinationEventEventId",
                table: "Certificates",
                column: "VaccinationEventEventId");

            migrationBuilder.AddForeignKey(
                name: "FK_Certificates_VaccinationEvents_VaccinationEventEventId",
                table: "Certificates",
                column: "VaccinationEventEventId",
                principalTable: "VaccinationEvents",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
