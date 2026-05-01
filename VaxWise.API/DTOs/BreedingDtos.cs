using System.ComponentModel.DataAnnotations;

namespace VaxWise.API.DTOs
{
    public class CreateBreedingRecordDto
    {
        [Required]
        public int FemaleAnimalId { get; set; }

        [Required]
        public int MaleAnimalId { get; set; }

        [Required]
        public DateTime BreedingDate { get; set; }

        public string Notes { get; set; } = string.Empty;
    }

    public class BreedingRecordResponseDto
    {
        public int BreedingRecordId { get; set; }
        public string FemaleEarTag { get; set; } = string.Empty;
        public string MaleEarTag { get; set; } = string.Empty;
        public string AnimalTypeName { get; set; } = string.Empty;
        public DateTime BreedingDate { get; set; }
        public DateTime ExpectedBirthDate { get; set; }
        public int GestationDays { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class RecordBirthOutcomeDto
    {
        [Required]
        public int NumberOfOffspring { get; set; }

        public double BirthWeightKg { get; set; }

        // AllSurvived, SomeLost, AllLost
        public string SurvivalStatus { get; set; } = string.Empty;

        public string Notes { get; set; } = string.Empty;

        public DateTime ActualBirthDate { get; set; } = DateTime.UtcNow;
    }

    public class BirthOutcomeResponseDto
    {
        public int BreedingRecordId { get; set; }
        public string FemaleEarTag { get; set; } = string.Empty;
        public int NumberOfOffspring { get; set; }
        public double BirthWeightKg { get; set; }
        public string SurvivalStatus { get; set; } = string.Empty;
        public DateTime ActualBirthDate { get; set; }
        public List<string> OffspringEarTags { get; set; } = new();
    }
}