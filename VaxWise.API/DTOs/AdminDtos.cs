namespace VaxWise.API.DTOs
{
    public class AdminFarmDto
    {
        public int FarmId { get; set; }
        public string FarmName { get; set; } = string.Empty;
        public string FarmType { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string? GlnNumber { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string OwnerEmail { get; set; } = string.Empty;
        public int AnimalCount { get; set; }
        public int WorkerCount { get; set; }
        public double AverageComplianceScore { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
