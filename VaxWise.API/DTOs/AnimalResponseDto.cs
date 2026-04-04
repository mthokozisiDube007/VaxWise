namespace VaxWise.API.DTOs
{
    public class AnimalResponseDto
    {
        public int AnimalId { get; set; }
        public string EarTagNumber { get; set; } = string.Empty;
        public string RfidTag { get; set; } = string.Empty;
        public string AnimalTypeName { get; set; } = string.Empty;
        public string Breed { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public double CurrentWeightKg { get; set; }
        public DateTime PurchaseDate { get; set; }
        public decimal PurchasePrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ComplianceScore { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}