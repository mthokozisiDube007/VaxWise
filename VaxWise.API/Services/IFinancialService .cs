using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IFinancialService
    {
        Task<FinancialResponseDto> RecordIncomeAsync(CreateIncomeDto dto, int farmId);

        Task<FinancialResponseDto> RecordExpenseAsync(CreateExpenseDto dto, int farmId);

        Task<ProfitLossDto> GetMonthlyProfitLossAsync(int month, int year, int farmId);

        Task<List<FinancialResponseDto>> GetAllTransactionsAsync(int farmId);

        Task<AnimalCostDto> GetAnimalCostAsync(int animalId, int farmId);
    }
}
