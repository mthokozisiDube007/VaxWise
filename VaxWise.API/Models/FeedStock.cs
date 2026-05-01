using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class FeedStock
    {
        [Key]
        public int FeedStockId { get; set; }
        public int FarmId { get; set; }

        public string FeedType { get; set; } = string.Empty;
        public double CurrentStockKg { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPerKg { get; set; }

        // Alert fires when CurrentStockKg drops below this
        public double LowStockThresholdKg { get; set; } = 50;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}