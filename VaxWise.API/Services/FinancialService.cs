using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class FinancialService : IFinancialService
    {
        private readonly AppDbContext _context;

        public FinancialService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FinancialResponseDto> RecordIncomeAsync(
            CreateIncomeDto dto, int farmId)
        {
            var animal = await _context.Animals
                .FirstOrDefaultAsync(a => a.AnimalId == dto.AnimalId && a.FarmId == farmId);

            if (animal == null)
                throw new Exception("Animal not found");

            var transaction = new Financial
            {
                FarmId = farmId,
                TransactionType = "Income",
                Category = "AnimalSale",
                Description = $"Sale of animal {animal.EarTagNumber} to {dto.BuyerName}",
                Amount = dto.Amount,
                TransactionDate = dto.SaleDate,
                AnimalId = dto.AnimalId,
                BuyerName = dto.BuyerName,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Financials.Add(transaction);

            animal.Status = "Sold";

            await _context.SaveChangesAsync();

            return MapToResponseDto(transaction, animal.EarTagNumber);
        }

        public async Task<FinancialResponseDto> RecordExpenseAsync(
            CreateExpenseDto dto, int farmId)
        {
            string? earTag = null;

            if (dto.AnimalId.HasValue)
            {
                var animal = await _context.Animals
                    .FirstOrDefaultAsync(a => a.AnimalId == dto.AnimalId && a.FarmId == farmId);
                earTag = animal?.EarTagNumber;
            }

            var transaction = new Financial
            {
                FarmId = farmId,
                TransactionType = "Expense",
                Category = dto.Category,
                Description = dto.Description,
                Amount = dto.Amount,
                TransactionDate = dto.ExpenseDate,
                AnimalId = dto.AnimalId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.Financials.Add(transaction);
            await _context.SaveChangesAsync();

            return MapToResponseDto(transaction, earTag);
        }

        public async Task<ProfitLossDto> GetMonthlyProfitLossAsync(
            int month, int year, int farmId)
        {
            var transactions = await _context.Financials
                .Include(f => f.Animal)
                .Where(f =>
                    f.FarmId == farmId &&
                    f.TransactionDate.Month == month &&
                    f.TransactionDate.Year == year)
                .OrderByDescending(f => f.TransactionDate)
                .ToListAsync();

            var totalIncome = transactions
                .Where(t => t.TransactionType == "Income")
                .Sum(t => t.Amount);

            var totalExpenses = transactions
                .Where(t => t.TransactionType == "Expense")
                .Sum(t => t.Amount);

            var netProfit = totalIncome - totalExpenses;

            return new ProfitLossDto
            {
                Month = month,
                Year = year,
                TotalIncome = totalIncome,
                TotalExpenses = totalExpenses,
                NetProfit = netProfit,
                IsProfitable = netProfit > 0,
                Transactions = transactions
                    .Select(t => MapToResponseDto(t, t.Animal?.EarTagNumber))
                    .ToList()
            };
        }

        public async Task<List<FinancialResponseDto>> GetAllTransactionsAsync(int farmId)
        {
            var transactions = await _context.Financials
                .Include(f => f.Animal)
                .Where(f => f.FarmId == farmId)
                .OrderByDescending(f => f.TransactionDate)
                .ToListAsync();

            return transactions
                .Select(t => MapToResponseDto(t, t.Animal?.EarTagNumber))
                .ToList();
        }

        public async Task<AnimalCostDto> GetAnimalCostAsync(int animalId, int farmId)
        {
            var animal = await _context.Animals
                .FirstOrDefaultAsync(a => a.AnimalId == animalId && a.FarmId == farmId);

            if (animal == null)
                throw new Exception("Animal not found");

            var expenses = await _context.Financials
                .Where(f =>
                    f.FarmId == farmId &&
                    f.AnimalId == animalId &&
                    f.TransactionType == "Expense")
                .SumAsync(f => f.Amount);

            var saleIncome = await _context.Financials
                .Where(f =>
                    f.FarmId == farmId &&
                    f.AnimalId == animalId &&
                    f.TransactionType == "Income")
                .SumAsync(f => f.Amount);

            var totalCost = animal.PurchasePrice + expenses;
            var netProfit = saleIncome > 0
                ? saleIncome - totalCost
                : (decimal?)null;

            return new AnimalCostDto
            {
                AnimalId = animal.AnimalId,
                EarTagNumber = animal.EarTagNumber,
                PurchasePrice = animal.PurchasePrice,
                TotalExpenses = expenses,
                TotalCost = totalCost,
                SalePrice = saleIncome > 0 ? saleIncome : null,
                NetProfit = netProfit,
                IsSold = animal.Status == "Sold"
            };
        }

        private static FinancialResponseDto MapToResponseDto(
            Financial transaction, string? earTag)
        {
            return new FinancialResponseDto
            {
                FinancialId = transaction.FinancialId,
                TransactionType = transaction.TransactionType,
                Category = transaction.Category,
                Description = transaction.Description,
                Amount = transaction.Amount,
                TransactionDate = transaction.TransactionDate,
                AnimalEarTag = earTag,
                Notes = transaction.Notes
            };
        }
    }
}
