using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class Financial
    {
        [Key]
        public int FinancialId { get; set; }

        // Income or Expense
        public string TransactionType { get; set; } = string.Empty;

        // Feed, Medication, VetFee, AnimalSale, Equipment, Other
        public string Category { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        public int FarmId { get; set; }
        public DateTime TransactionDate { get; set; }

        // Optional — links transaction to specific animal
        public int? AnimalId { get; set; }

        public string BuyerName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("AnimalId")]
        public Animal? Animal { get; set; }
    }
}