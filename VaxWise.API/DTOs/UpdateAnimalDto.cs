using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.DTOs
{
    public class UpdateAnimalDto
    {
        [StringLength(50)]
        public string? Breed { get; set; }

        [Range(0, 10000)]
        public double? CurrentWeightKg { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? PurchasePrice { get; set; }

        // Active, Sold, Deceased, Quarantined, UnderTreatment
        public string? Status { get; set; }
    }
}