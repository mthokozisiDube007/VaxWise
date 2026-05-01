using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaxWise.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFarmIdToAllModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "VaccinationEvents",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "HealthRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "Financials",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "FeedStocks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "FeedRecords",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "Animals",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_VaccinationEvents_FarmId",
                table: "VaccinationEvents",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthRecords_FarmId",
                table: "HealthRecords",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_Financials_FarmId",
                table: "Financials",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedStocks_FarmId",
                table: "FeedStocks",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedRecords_FarmId",
                table: "FeedRecords",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_Animals_FarmId",
                table: "Animals",
                column: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_Animals_Farms_FarmId",
                table: "Animals",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_FeedRecords_Farms_FarmId",
                table: "FeedRecords",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_FeedStocks_Farms_FarmId",
                table: "FeedStocks",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_Financials_Farms_FarmId",
                table: "Financials",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_HealthRecords_Farms_FarmId",
                table: "HealthRecords",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_VaccinationEvents_Farms_FarmId",
                table: "VaccinationEvents",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Animals_Farms_FarmId",
                table: "Animals");

            migrationBuilder.DropForeignKey(
                name: "FK_FeedRecords_Farms_FarmId",
                table: "FeedRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_FeedStocks_Farms_FarmId",
                table: "FeedStocks");

            migrationBuilder.DropForeignKey(
                name: "FK_Financials_Farms_FarmId",
                table: "Financials");

            migrationBuilder.DropForeignKey(
                name: "FK_HealthRecords_Farms_FarmId",
                table: "HealthRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_VaccinationEvents_Farms_FarmId",
                table: "VaccinationEvents");

            migrationBuilder.DropIndex(
                name: "IX_VaccinationEvents_FarmId",
                table: "VaccinationEvents");

            migrationBuilder.DropIndex(
                name: "IX_HealthRecords_FarmId",
                table: "HealthRecords");

            migrationBuilder.DropIndex(
                name: "IX_Financials_FarmId",
                table: "Financials");

            migrationBuilder.DropIndex(
                name: "IX_FeedStocks_FarmId",
                table: "FeedStocks");

            migrationBuilder.DropIndex(
                name: "IX_FeedRecords_FarmId",
                table: "FeedRecords");

            migrationBuilder.DropIndex(
                name: "IX_Animals_FarmId",
                table: "Animals");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "VaccinationEvents");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "HealthRecords");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "Financials");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "FeedStocks");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "FeedRecords");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "Animals");
        }
    }
}
