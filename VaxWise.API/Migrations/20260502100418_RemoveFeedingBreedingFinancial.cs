using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaxWise.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveFeedingBreedingFinancial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BreedingRecords");

            migrationBuilder.DropTable(
                name: "FeedRecords");

            migrationBuilder.DropTable(
                name: "FeedStocks");

            migrationBuilder.DropTable(
                name: "Financials");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BreedingRecords",
                columns: table => new
                {
                    BreedingRecordId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FemaleAnimalId = table.Column<int>(type: "int", nullable: false),
                    MaleAnimalId = table.Column<int>(type: "int", nullable: false),
                    ActualBirthDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BirthWeightKg = table.Column<double>(type: "float", nullable: true),
                    BreedingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedBirthDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GestationDays = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NumberOfOffspring = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SurvivalStatus = table.Column<string>(type: "nvarchar(max)", nullable: true)
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

            migrationBuilder.CreateTable(
                name: "FeedRecords",
                columns: table => new
                {
                    FeedRecordId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnimalTypeId = table.Column<int>(type: "int", nullable: false),
                    CostPerKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FarmId = table.Column<int>(type: "int", nullable: false),
                    FeedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FeedType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuantityKg = table.Column<double>(type: "float", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedRecords", x => x.FeedRecordId);
                    table.ForeignKey(
                        name: "FK_FeedRecords_AnimalTypes_AnimalTypeId",
                        column: x => x.AnimalTypeId,
                        principalTable: "AnimalTypes",
                        principalColumn: "AnimalTypeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FeedRecords_Farms_FarmId",
                        column: x => x.FarmId,
                        principalTable: "Farms",
                        principalColumn: "FarmId");
                });

            migrationBuilder.CreateTable(
                name: "FeedStocks",
                columns: table => new
                {
                    FeedStockId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CostPerKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrentStockKg = table.Column<double>(type: "float", nullable: false),
                    FarmId = table.Column<int>(type: "int", nullable: false),
                    FeedType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LowStockThresholdKg = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedStocks", x => x.FeedStockId);
                    table.ForeignKey(
                        name: "FK_FeedStocks_Farms_FarmId",
                        column: x => x.FarmId,
                        principalTable: "Farms",
                        principalColumn: "FarmId");
                });

            migrationBuilder.CreateTable(
                name: "Financials",
                columns: table => new
                {
                    FinancialId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnimalId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BuyerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FarmId = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TransactionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TransactionType = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Financials", x => x.FinancialId);
                    table.ForeignKey(
                        name: "FK_Financials_Animals_AnimalId",
                        column: x => x.AnimalId,
                        principalTable: "Animals",
                        principalColumn: "AnimalId");
                    table.ForeignKey(
                        name: "FK_Financials_Farms_FarmId",
                        column: x => x.FarmId,
                        principalTable: "Farms",
                        principalColumn: "FarmId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BreedingRecords_FemaleAnimalId",
                table: "BreedingRecords",
                column: "FemaleAnimalId");

            migrationBuilder.CreateIndex(
                name: "IX_BreedingRecords_MaleAnimalId",
                table: "BreedingRecords",
                column: "MaleAnimalId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedRecords_AnimalTypeId",
                table: "FeedRecords",
                column: "AnimalTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedRecords_FarmId",
                table: "FeedRecords",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedStocks_FarmId",
                table: "FeedStocks",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_Financials_AnimalId",
                table: "Financials",
                column: "AnimalId");

            migrationBuilder.CreateIndex(
                name: "IX_Financials_FarmId",
                table: "Financials",
                column: "FarmId");
        }
    }
}
