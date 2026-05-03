namespace VaxWise.API.Models
{
    public class VaccineSchedule
    {
        public int VaccineScheduleId { get; set; }
        public int AnimalTypeId { get; set; }
        public string VaccineName { get; set; } = string.Empty;

        // Recommended interval in days between doses
        public int IntervalDays { get; set; }

        // True = DALRRD notifiable disease — must report within ReportingWindowHours
        public bool IsNotifiable { get; set; }
        public string? NotifiableDiseaseName { get; set; }
        public int ReportingWindowHours { get; set; } = 24;

        public AnimalType AnimalType { get; set; } = null!;
    }
}
