using System.ComponentModel.DataAnnotations;

namespace VaxWise.API.DTOs
{
    public class CreateHealthRecordDto
    {
        [Required]
        public int AnimalId { get; set; }

        // Treatment, VetVisit, Observation
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
    }

    public class HealthRecordResponseDto
    {
        public int HealthRecordId { get; set; }
        public int AnimalId { get; set; }
        public string AnimalEarTag { get; set; } = string.Empty;
        public string RecordType { get; set; } = string.Empty;
        public string Symptoms { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public string MedicationUsed { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string VetName { get; set; } = string.Empty;
        public string Outcome { get; set; } = string.Empty;
        public DateTime TreatmentDate { get; set; }
        public bool IsUnderTreatment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class OutbreakAlertDto
    {
        public bool OutbreakDetected { get; set; }
        public string Symptoms { get; set; } = string.Empty;
        public int AffectedAnimalsCount { get; set; }
        public List<string> AffectedEarTags { get; set; } = new();
        public string AlertMessage { get; set; } = string.Empty;
        public DateTime DetectedAt { get; set; }
    }
}