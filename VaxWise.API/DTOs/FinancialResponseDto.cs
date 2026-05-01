using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.DTOs
{
    public class CreateIncomeDto
    {
        [Required]
        public int AnimalId { get; set; }

        [Required]
        public string BuyerName { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime SaleDate { get; set; } = DateTime.UtcNow;

        public string Notes { get; set; } = string.Empty;
    }

    public class CreateExpenseDto
    {
        [Required]
        public string Category { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

        public int? AnimalId { get; set; }

        public string Notes { get; set; } = string.Empty;
    }

    public class FinancialResponseDto
    {
        public int FinancialId { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime TransactionDate { get; set; }
        public string? AnimalEarTag { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public class ProfitLossDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal TotalIncome { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit { get; set; }
        public bool IsProfitable { get; set; }
        public List<FinancialResponseDto> Transactions { get; set; } = new();
    }

    public class AnimalCostDto
    {
        public int AnimalId { get; set; }
        public string EarTagNumber { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal TotalCost { get; set; }
        public decimal? SalePrice { get; set; }
        public decimal? NetProfit { get; set; }
        public bool IsSold { get; set; }
    }
}