using System.ComponentModel.DataAnnotations;

namespace VaxWise.API.DTOs
{
    public class CreateHealthRecordDto
    {
        [Required]
        public int AnimalId { get; set; }

        [Required]
        public string RecordType { get; set; } = string.Empty;

        [Required]
        public string Symptoms { get; set; } = string.Empty;

        [Required]
        public string Diagnosis { get; set; } = string.Empty;

        public string MedicationUsed { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;

        [Required]
        public string VetName { get; set; } = string.Empty;

        public string Outcome { get; set; } = string.Empty;
        public DateTime TreatmentDate { get; set; } = DateTime.UtcNow;

        // Days the animal cannot be sold/slaughtered after this treatment (0 = no withdrawal)
        [Range(0, 365)]
        public int WithdrawalDays { get; set; } = 0;
    }

    public class HealthRecordResponseDto
    {
        public int HealthRecordId { get; init; }
        public int AnimalId { get; init; }
        public string AnimalEarTag { get; init; } = string.Empty;
        public string RecordType { get; init; } = string.Empty;
        public string Symptoms { get; init; } = string.Empty;
        public string Diagnosis { get; init; } = string.Empty;
        public string MedicationUsed { get; init; } = string.Empty;
        public string Dosage { get; init; } = string.Empty;
        public string VetName { get; init; } = string.Empty;
        public string Outcome { get; init; } = string.Empty;
        public DateTime TreatmentDate { get; init; }
        public bool IsUnderTreatment { get; init; }
        public int WithdrawalDays { get; init; }
        public DateTime? WithdrawalClearDate { get; init; }
        public bool IsWithdrawalActive { get; init; }
        public int DaysUntilClear { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    public class OutbreakAlertDto
    {
        public bool OutbreakDetected { get; set; }
        public string RiskLevel { get; set; } = "None";
        public string Symptoms { get; set; } = string.Empty;
        public int AffectedAnimalsCount { get; set; }
        public List<string> AffectedEarTags { get; set; } = new();
        public string AlertMessage { get; set; } = string.Empty;
        public DateTime DetectedAt { get; set; }

        // Notifiable disease fields (Feature 2)
        public bool IsNotifiable { get; set; }
        public string? NotifiableDiseaseName { get; set; }
        public DateTime? DalrrdReportDeadline { get; set; }
    }
}