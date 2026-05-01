using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaxWise.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBreedingRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BreedingRecords",
                columns: table => new
                {
                    BreedingRecordId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FemaleAnimalId = table.Column<int>(type: "int", nullable: false),
                    MaleAnimalId = table.Column<int>(type: "int", nullable: false),
                    BreedingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedBirthDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GestationDays = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NumberOfOffspring = table.Column<int>(type: "int", nullable: true),
                    BirthWeightKg = table.Column<double>(type: "float", nullable: true),
                    SurvivalStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActualBirthDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BreedingRecords", x => x.BreedingRecordId);
                    table.ForeignKey(
                        name: "FK_BreedingRecords_Animals_FemaleAnimalId",
                        column: x => x.FemaleAnimalId,
                        principalTable: "Animals",
                        principalColumn: "AnimalId");
                    table.ForeignKey(
                        name: "FK_BreedingRecords_Animals_MaleAnimalId",
                        column: x => x.MaleAnimalId,
                        principalTable: "Animals",
                        principalColumn: "AnimalId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BreedingRecords_FemaleAnimalId",
                table: "BreedingRecords",
                column: "FemaleAnimalId");

            migrationBuilder.CreateIndex(
                name: "IX_BreedingRecords_MaleAnimalId",
                table: "BreedingRecords",
                column: "MaleAnimalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BreedingRecords");
        }
    }
}
