using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class HealthRecord
    {
        [Key]
        public int HealthRecordId { get; set; }

        public int AnimalId { get; set; }

        // Treatment, VetVisit, Observation
        public string RecordType { get; set; } = string.Empty;

        public string Symptoms { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public string MedicationUsed { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string VetName { get; set; } = string.Empty;
        public string Outcome { get; set; } = string.Empty;
        public DateTime TreatmentDate { get; set; }

        // True while animal is receiving treatment
        public bool IsUnderTreatment { get; set; } = true;

        // Days before the animal can be sold or slaughtered after treatment
        public int WithdrawalDays { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("AnimalId")]
        public Animal Animal { get; set; } = null!;
        public int FarmId { get; set; }
    }
}