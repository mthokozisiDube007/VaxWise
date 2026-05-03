using Microsoft.EntityFrameworkCore;
using VaxWise.API.Algorithms;
using VaxWise.API.Data;
using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardDto> GetDashboardAsync(int farmId)
        {
            var now = DateTime.UtcNow;
            var sevenDaysFromNow = now.AddDays(7);
            var twelveMonthsAgo = now.AddMonths(-12);

            var animals = await _context.Animals
                .Where(a => a.FarmId == farmId)
                .ToListAsync();

            var upcomingVaccinations = await _context.VaccinationEvents
                .Include(v => v.Animal)
                .Where(v =>
                    v.FarmId == farmId &&
                    v.NextDueDate <= sevenDaysFromNow &&
                    v.NextDueDate >= now)
                .ToListAsync();

            var currentlyUnderTreatment = await _context.HealthRecords
                .CountAsync(h => h.FarmId == farmId && h.IsUnderTreatment);

            // Outbreak: check 48h window using the smart engine
            var recentHealthRecords = await _context.HealthRecords
                .Include(h => h.Animal)
                .Where(h => h.FarmId == farmId && h.TreatmentDate >= now.AddHours(-48))
                .ToListAsync();

            // Feature 2 — load notifiable disease keywords
            var notifiableDiseases = await _context.VaccineSchedules
                .Where(vs => vs.IsNotifiable && vs.NotifiableDiseaseName != null)
                .Select(vs => new { vs.VaccineName, DiseaseName = vs.NotifiableDiseaseName!, vs.ReportingWindowHours })
                .Distinct()
                .ToListAsync();

            var notifiableList = notifiableDiseases
                .Select(d => (d.VaccineName, d.DiseaseName, d.ReportingWindowHours))
                .ToList<(string Keyword, string DiseaseName, int ReportingWindowHours)>();

            bool activeOutbreak = false;
            bool notifiableDiseaseDetected = false;
            string? notifiableDiseaseName = null;
            DateTime? dalrrdDeadline = null;

            if (recentHealthRecords.Count >= 3)
            {
                var mostReported = recentHealthRecords
                    .GroupBy(h => h.Symptoms)
                    .OrderByDescending(g => g.Count())
                    .First();

                var records = recentHealthRecords
                    .Select(r => (r, r.Animal.EarTagNumber))
                    .ToList();

                var alert = OutbreakDetectionEngine.Analyse(
                    mostReported.Key, records, animals.Count, notifiableList);

                activeOutbreak          = alert.OutbreakDetected;
                notifiableDiseaseDetected = alert.IsNotifiable;
                notifiableDiseaseName   = alert.NotifiableDiseaseName;
                dalrrdDeadline          = alert.DalrrdReportDeadline;
            }

            // Feature 3 — count animals with active withdrawal periods
            var activeHealthRecords = await _context.HealthRecords
                .Where(h => h.FarmId == farmId && h.WithdrawalDays > 0)
                .ToListAsync();

            int animalsUnderWithdrawal = activeHealthRecords
                .Count(h => WithdrawalPeriodCalculator.IsActive(h.TreatmentDate, h.WithdrawalDays, now));

            var totalCertificates = await _context.Certificates
                .Include(c => c.VaccinationEvent)
                .CountAsync(c => c.VaccinationEvent.FarmId == farmId);

            var totalVaccinations = await _context.VaccinationEvents
                .CountAsync(v => v.FarmId == farmId);

            // --- Vaccination coverage intelligence ---

            var allVaccinationEvents = await _context.VaccinationEvents
                .Where(v => v.FarmId == farmId)
                .ToListAsync();

            // Latest event per animal (in-memory — safe for typical farm sizes)
            var latestEventByAnimal = allVaccinationEvents
                .GroupBy(v => v.AnimalId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(v => v.EventTimestamp).First());

            var animalIds = animals.Select(a => a.AnimalId).ToHashSet();

            int overdueVaccinationsCount = animalIds
                .Count(id => latestEventByAnimal.TryGetValue(id, out var ev)
                             && ev.NextDueDate < now);

            int neverVaccinatedCount = animalIds
                .Count(id => !latestEventByAnimal.ContainsKey(id));

            // % of animals vaccinated at least once in the last 12 months
            var vaccinatedLast12Months = allVaccinationEvents
                .Where(v => v.EventTimestamp >= twelveMonthsAgo)
                .Select(v => v.AnimalId)
                .Distinct()
                .Count();

            double coverageRate = animals.Count > 0
                ? Math.Round((double)vaccinatedLast12Months / animals.Count * 100, 1)
                : 0;

            // --- Farm risk score ---
            int avgCompliance = animals.Count > 0
                ? (int)animals.Average(a => a.ComplianceScore)
                : 0;

            int quarantinedCount = animals.Count(a => a.Status == "Quarantined");
            int underTreatmentCount = animals.Count(a => a.Status == "UnderTreatment");

            var (riskScore, riskLevel) = RiskScoreEngine.Compute(
                totalAnimals: animals.Count,
                overdueVaccinations: overdueVaccinationsCount,
                neverVaccinated: neverVaccinatedCount,
                underTreatment: underTreatmentCount,
                quarantined: quarantinedCount,
                activeOutbreak: activeOutbreak,
                averageComplianceScore: avgCompliance);

            return new DashboardDto
            {
                TotalAnimals = animals.Count,
                ActiveAnimals = animals.Count(a => a.Status == "Active"),
                AnimalsUnderTreatment = underTreatmentCount,
                QuarantinedAnimals = quarantinedCount,
                AverageComplianceScore = avgCompliance,
                UpcomingVaccinationsCount = upcomingVaccinations.Count,
                UpcomingVaccinationEarTags = upcomingVaccinations
                    .Select(v => v.Animal.EarTagNumber).ToList(),
                AnimalsCurrentlyUnderTreatment = currentlyUnderTreatment,
                ActiveOutbreakDetected = activeOutbreak,
                NotifiableDiseaseDetected = notifiableDiseaseDetected,
                NotifiableDiseaseName = notifiableDiseaseName,
                DalrrdReportDeadline = dalrrdDeadline,
                AnimalsUnderWithdrawal = animalsUnderWithdrawal,
                OverdueVaccinationsCount = overdueVaccinationsCount,
                NeverVaccinatedCount = neverVaccinatedCount,
                VaccinationCoverageRate = coverageRate,
                FarmRiskScore = riskScore,
                FarmRiskLevel = riskLevel,
                TotalCertificatesIssued = totalCertificates,
                TotalVaccinationEvents = totalVaccinations,
                GeneratedAt = now
            };
        }
    }
}
