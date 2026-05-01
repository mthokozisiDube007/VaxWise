using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class BreedingRecord
    {
        [Key]
        public int BreedingRecordId { get; set; }

        public int FemaleAnimalId { get; set; }
        public int MaleAnimalId { get; set; }

        public DateTime BreedingDate { get; set; }
        public DateTime ExpectedBirthDate { get; set; }
        public int GestationDays { get; set; }

        // Bred, Pregnant, Delivered, Lost
        public string Status { get; set; } = "Bred";

        // Birth outcome fields
        public int? NumberOfOffspring { get; set; }
        public double? BirthWeightKg { get; set; }
        public string? SurvivalStatus { get; set; }
        public DateTime? ActualBirthDate { get; set; }

        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        
        public Animal FemaleAnimal { get; set; } = null!;

     
        public Animal MaleAnimal { get; set; } = null!;
    }
}