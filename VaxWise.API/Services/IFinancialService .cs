using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IFinancialService
    {
        /// <summary>
        /// Records income from an animal sale.
        /// Updates animal status to Sold.
        /// </summary>
        Task<FinancialResponseDto> RecordIncomeAsync(CreateIncomeDto dto);

        /// <summary>
        /// Records a farm expense — feed, medication, vet fees etc.
        /// </summary>
        Task<FinancialResponseDto> RecordExpenseAsync(CreateExpenseDto dto);

        /// <summary>
        /// Returns monthly profit and loss summary.
        /// </summary>
        Task<ProfitLossDto> GetMonthlyProfitLossAsync(int month, int year);

        /// <summary>
        /// Returns all transactions — income and expenses.
        /// </summary>
        Task<List<FinancialResponseDto>> GetAllTransactionsAsync();

        /// <summary>
        /// Calculates total cost of one animal from purchase to sale.
        /// </summary>
        Task<AnimalCostDto> GetAnimalCostAsync(int animalId);
    }
}