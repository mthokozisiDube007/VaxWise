using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class VaccinationEvent
    {    
            [Key]
        public int EventId { get; set; }

        // Links to the animal being vaccinated
        public int AnimalId { get; set; }

        // The vet's SAVC registration number — part of the hash
        public string SavcNumber { get; set; } = string.Empty;

        // Vaccine details — part of the hash
        public string VaccineBatch { get; set; } = string.Empty;
        public string VaccineName { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public string Manufacturer { get; set; } = string.Empty;

        // GPS coordinates — part of the hash
        public string GpsCoordinates { get; set; } = string.Empty;

        // The timestamp of the event — part of the hash
        public DateTime EventTimestamp { get; set; }

        // The SHA-256 cryptographic hash — proof of the event
        public string AuditHash { get; set; } = string.Empty;

        // Next vaccination due date — drives alerts
        public DateTime NextDueDate { get; set; }

        // Offline or Online capture
        public string CaptureMode { get; set; } = "Online";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Animal Animal { get; set; } = null!;
        public int FarmId { get; set; }
    }
}