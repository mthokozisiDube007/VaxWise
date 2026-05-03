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
        public bool NotifiableDiseaseDetected { get; set; }
        public string? NotifiableDiseaseName { get; set; }
        public DateTime? DalrrdReportDeadline { get; set; }
        public int AnimalsUnderWithdrawal { get; set; }

        // Vaccination coverage intelligence
        public int OverdueVaccinationsCount { get; set; }
        public int NeverVaccinatedCount { get; set; }
        public double VaccinationCoverageRate { get; set; }

        // Farm biosecurity risk
        public int FarmRiskScore { get; set; }
        public string FarmRiskLevel { get; set; } = "Low";

        // System summary
        public int TotalCertificatesIssued { get; set; }
        public int TotalVaccinationEvents { get; set; }
        public DateTime GeneratedAt { get; set; }
    }
}