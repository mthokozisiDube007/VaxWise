using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaxWise.API.Migrations
{
    /// <inheritdoc />
    /// 
    public partial class AddFeedManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FeedRecords",
                columns: table => new
                {
                    FeedRecordId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnimalTypeId = table.Column<int>(type: "int", nullable: false),
                    FeedType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuantityKg = table.Column<double>(type: "float", nullable: false),
                    CostPerKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FeedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                });

            migrationBuilder.CreateTable(
                name: "FeedStocks",
                columns: table => new
                {
                    FeedStockId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FeedType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CurrentStockKg = table.Column<double>(type: "float", nullable: false),
                    CostPerKg = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LowStockThresholdKg = table.Column<double>(type: "float", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedStocks", x => x.FeedStockId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeedRecords_AnimalTypeId",
                table: "FeedRecords",
                column: "AnimalTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeedRecords");

            migrationBuilder.DropTable(
                name: "FeedStocks");
        }
    }
}
