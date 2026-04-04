using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.DTOs
{
    public class CreateAnimalDto
    {
        [Required]
        [StringLength(20)]
        public string EarTagNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string RfidTag { get; set; } = string.Empty;

        [Required]
        public int AnimalTypeId { get; set; }

        [Required]
        [StringLength(50)]
        public string Breed { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        [StringLength(1)]
        public string Gender { get; set; } = string.Empty;

        [Range(0, 10000)]
        public double CurrentWeightKg { get; set; }

        [Required]
        public DateTime PurchaseDate { get; set; }

        [Range(0, 1000000)]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PurchasePrice { get; set; }
    }
}