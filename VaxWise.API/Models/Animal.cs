using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class Animal
    {
        public int AnimalId { get; set; }
        // Add this field
        public int FarmId { get; set; }
        // Unique ear tag number printed on the physical tag
        public string EarTagNumber { get; set; } = string.Empty;

        // RFID tag number used for electronic scanning at vaccination events
        public string RfidTag { get; set; } = string.Empty;

        // Foreign key linking to AnimalType table
        public int AnimalTypeId { get; set; }

        public string Breed { get; set; } = string.Empty;

        public DateTime DateOfBirth { get; set; }

        // M = Male, F = Female
        public string Gender { get; set; } = string.Empty;

        public double CurrentWeightKg { get; set; }

        public DateTime PurchaseDate { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal PurchasePrice { get; set; }

        // Active, Sold, Deceased, Quarantined, UnderTreatment
        public string Status { get; set; } = "Active";

        // Biosecurity compliance score 0-100 calculated from vaccination history
        public int ComplianceScore { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property - gives you access to the AnimalType object
        public AnimalType AnimalType { get; set; } = null!;
        // Add this navigation property
        [ForeignKey("FarmId")]
        public Farm Farm { get; set; } = null!;
    }
}