using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.DTOs
{
    // What a farmer sends when recording daily feed
    public class CreateFeedRecordDto
    {
        [Required]
        public int AnimalTypeId { get; set; }

        [Required]
        public string FeedType { get; set; } = string.Empty;

        [Range(0, 10000)]
        public double QuantityKg { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPerKg { get; set; }

        public DateTime FeedDate { get; set; } = DateTime.UtcNow;

        public string Notes { get; set; } = string.Empty;
    }

    // What a farmer sends when updating stock
    public class UpdateFeedStockDto
    {
        [Required]
        public string FeedType { get; set; } = string.Empty;

        [Range(0, 100000)]
        public double QuantityKg { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPerKg { get; set; }

        // Alert fires when stock drops below this level
        [Range(0, 10000)]
        public double LowStockThresholdKg { get; set; } = 50;
    }

    // What the API returns for feed records
    public class FeedRecordResponseDto
    {
        public int FeedRecordId { get; set; }
        public string AnimalTypeName { get; set; } = string.Empty;
        public string FeedType { get; set; } = string.Empty;
        public double QuantityKg { get; set; }
        public decimal CostPerKg { get; set; }
        public decimal TotalCost { get; set; }
        public DateTime FeedDate { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    // What the API returns for stock levels
    public class FeedStockResponseDto
    {
        public int FeedStockId { get; set; }
        public string FeedType { get; set; } = string.Empty;
        public double CurrentStockKg { get; set; }
        public decimal CostPerKg { get; set; }
        public double LowStockThresholdKg { get; set; }
        public bool IsLowStock { get; set; }
        public string AlertMessage { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
    }
}