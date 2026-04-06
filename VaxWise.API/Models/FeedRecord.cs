using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class FeedRecord
    {
        [Key]
        public int FeedRecordId { get; set; }

        public int AnimalTypeId { get; set; }
        public string FeedType { get; set; } = string.Empty;

        public double QuantityKg { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPerKg { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost { get; set; }

        public DateTime FeedDate { get; set; }
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("AnimalTypeId")]
        public AnimalType AnimalType { get; set; } = null!;
    }
}