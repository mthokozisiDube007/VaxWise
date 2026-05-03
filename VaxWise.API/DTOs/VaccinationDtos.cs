using System.ComponentModel.DataAnnotations;

namespace VaxWise.API.DTOs
{
    // What the vet sends when capturing a vaccination event 
    public class CreateVaccinationDto
    {
        [Required]
        public int AnimalId { get; set; }

        [Required]
        public string VaccineBatch { get; set; } = string.Empty;

        [Required]
        public string VaccineName { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiryDate { get; set; }

        [Required]
        public string Manufacturer { get; set; } = string.Empty;

        [Required]
        public string GpsCoordinates { get; set; } = string.Empty;

        // Optional — auto-calculated from Vaccine Schedule Library if omitted
        public DateTime? NextDueDate { get; set; }

        // Online or Offline
        public string CaptureMode { get; set; } = "Online";
    }

    // What the API sends back after creating or fetching a vaccination event 
    public class VaccinationResponseDto
    {
        public int EventId { get; set; }
        public int AnimalId { get; set; }
        public string AnimalEarTag { get; set; } = string.Empty;
        public string VaccineName { get; set; } = string.Empty;
        public string VaccineBatch { get; set; } = string.Empty;
        public string GpsCoordinates { get; set; } = string.Empty;
        public DateTime EventTimestamp { get; set; }
        public string AuditHash { get; set; } = string.Empty;
        public DateTime NextDueDate { get; set; }
        public string CaptureMode { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class VaccineScheduleDto
    {
        public int VaccineScheduleId { get; init; }
        public string VaccineName { get; init; } = string.Empty;
        public int IntervalDays { get; init; }
        public bool IsNotifiable { get; init; }
        public string? NotifiableDiseaseName { get; init; }
        public int ReportingWindowHours { get; init; }
    }

    // For Delta-Sync — batch of offline events the vet sends when back online
    public class SyncVaccinationsDto
    {
        [Required]
        public List<CreateVaccinationDto> Events { get; set; } = new();
    }
}