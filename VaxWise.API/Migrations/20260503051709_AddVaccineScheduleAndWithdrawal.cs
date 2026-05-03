using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace VaxWise.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVaccineScheduleAndWithdrawal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WithdrawalDays",
                table: "HealthRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "VaccineSchedules",
                columns: table => new
                {
                    VaccineScheduleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnimalTypeId = table.Column<int>(type: "int", nullable: false),
                    VaccineName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IntervalDays = table.Column<int>(type: "int", nullable: false),
                    IsNotifiable = table.Column<bool>(type: "bit", nullable: false),
                    NotifiableDiseaseName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReportingWindowHours = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VaccineSchedules", x => x.VaccineScheduleId);
                    table.ForeignKey(
                        name: "FK_VaccineSchedules_AnimalTypes_AnimalTypeId",
                        column: x => x.AnimalTypeId,
                        principalTable: "AnimalTypes",
                        principalColumn: "AnimalTypeId");
                });

            migrationBuilder.InsertData(
                table: "VaccineSchedules",
                columns: new[] { "VaccineScheduleId", "AnimalTypeId", "IntervalDays", "IsNotifiable", "NotifiableDiseaseName", "ReportingWindowHours", "VaccineName" },
                values: new object[,]
                {
                    { 1, 1, 180, true, "Foot-and-Mouth Disease", 24, "FMD Vaccine" },
                    { 2, 1, 365, true, "Brucellosis", 24, "Brucellosis Vaccine" },
                    { 3, 1, 365, true, "Anthrax", 24, "Anthrax Vaccine" },
                    { 4, 1, 365, true, "Lumpy Skin Disease", 24, "Lumpy Skin Disease Vaccine" },
                    { 5, 1, 365, true, "Bluetongue", 24, "Bluetongue Vaccine" },
                    { 6, 1, 365, false, null, 24, "Blackleg Vaccine" },
                    { 7, 2, 180, true, "Foot-and-Mouth Disease", 24, "FMD Vaccine" },
                    { 8, 2, 365, true, "Anthrax", 24, "Anthrax Vaccine" },
                    { 9, 2, 365, true, "Bluetongue", 24, "Bluetongue Vaccine" },
                    { 10, 2, 365, false, null, 24, "Pasteurellosis Vaccine" },
                    { 11, 3, 180, true, "Foot-and-Mouth Disease", 24, "FMD Vaccine" },
                    { 12, 3, 365, false, null, 24, "Pasteurellosis Vaccine" },
                    { 13, 4, 180, true, "Foot-and-Mouth Disease", 24, "FMD Vaccine" },
                    { 14, 4, 180, true, "African Swine Fever", 24, "African Swine Fever Vaccine" },
                    { 15, 5, 42, true, "Newcastle Disease", 24, "Newcastle Disease Vaccine" },
                    { 16, 5, 180, true, "Highly Pathogenic Avian Influenza", 24, "Avian Influenza Vaccine" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_VaccineSchedules_AnimalTypeId",
                table: "VaccineSchedules",
                column: "AnimalTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VaccineSchedules");

            migrationBuilder.DropColumn(
                name: "WithdrawalDays",
                table: "HealthRecords");
        }
    }
}
