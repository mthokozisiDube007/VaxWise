namespace VaxWise.API.DTOs
{
    public class DashboardDto
    {
        // Animal summary
        public int TotalAnimals { get; set; }
        public int ActiveAnimals { get; set; }
        public int AnimalsUnderTreatment { get; set; }
        public int QuarantinedAnimals { get; set; }
        public int AverageComplianceScore { get; set; }

        // Vaccination alerts
        public int UpcomingVaccinationsCount { get; set; }
        public List<string> UpcomingVaccinationEarTags { get; set; } = new();

        // Health alerts
        public int AnimalsCurrentlyUnderTreatment { get; set; }
        public bool ActiveOutbreakDetected { get; set; }

        // Feed alerts
        public int LowStockAlertCount { get; set; }
        public List<string> LowStockFeedTypes { get; set; } = new();

        // Breeding alerts
        public int UpcomingBirthsCount { get; set; }

        // Financial summary
        public decimal TotalIncomeThisMonth { get; set; }
        public decimal TotalExpensesThisMonth { get; set; }
        public decimal NetProfitThisMonth { get; set; }
        public bool IsProfitableThisMonth { get; set; }

        // System summary
        public int TotalCertificatesIssued { get; set; }
        public int TotalVaccinationEvents { get; set; }
        public DateTime GeneratedAt { get; set; }
    }
}