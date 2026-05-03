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
            var fortyEightHoursAgo = now.AddHours(-48);

            // All queries are read-only — AsNoTracking() skips change tracking overhead
            var animals = await _context.Animals
                .AsNoTracking()
                .Where(a => a.FarmId == farmId)
                .ToListAsync();

            // Project to only the fields needed — avoids loading full Animal navigation
            var upcomingEarTags = await _context.VaccinationEvents
                .AsNoTracking()
                .Where(v => v.FarmId == farmId && v.NextDueDate <= sevenDaysFromNow && v.NextDueDate >= now)
                .Select(v => v.Animal.EarTagNumber)
                .ToListAsync();

            var currentlyUnderTreatment = await _context.HealthRecords
                .CountAsync(h => h.FarmId == farmId && h.IsUnderTreatment);

            var recentHealthRecords = await _context.HealthRecords
                .AsNoTracking()
                .Include(h => h.Animal)
                .Where(h => h.FarmId == farmId && h.TreatmentDate >= fortyEightHoursAgo)
                .ToListAsync();

            var notifiableDiseases = await _context.VaccineSchedules
                .AsNoTracking()
                .Where(vs => vs.IsNotifiable && vs.NotifiableDiseaseName != null)
                .Select(vs => new { vs.VaccineName, DiseaseName = vs.NotifiableDiseaseName!, vs.ReportingWindowHours })
                .Distinct()
                .ToListAsync();

            // Project to only AnimalId + timestamps needed for coverage calculation
            var allVaccinationEvents = await _context.VaccinationEvents
                .AsNoTracking()
                .Where(v => v.FarmId == farmId)
                .Select(v => new { v.AnimalId, v.EventTimestamp, v.NextDueDate })
                .ToListAsync();

            // Project to only fields needed for withdrawal calculation
            var withdrawalRecords = await _context.HealthRecords
                .AsNoTracking()
                .Where(h => h.FarmId == farmId && h.WithdrawalDays > 0)
                .Select(h => new { h.TreatmentDate, h.WithdrawalDays })
                .ToListAsync();

            var totalCertificates = await _context.Certificates
                .CountAsync(c => c.VaccinationEvent.FarmId == farmId);

            var totalVaccinations = await _context.VaccinationEvents
                .CountAsync(v => v.FarmId == farmId);

            // ── Outbreak detection ──────────────────────────────────────────
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

                activeOutbreak = alert.OutbreakDetected;
                notifiableDiseaseDetected = alert.IsNotifiable;
                notifiableDiseaseName = alert.NotifiableDiseaseName;
                dalrrdDeadline = alert.DalrrdReportDeadline;
            }

            // ── Withdrawal count ────────────────────────────────────────────
            int animalsUnderWithdrawal = withdrawalRecords
                .Count(h => WithdrawalPeriodCalculator.IsActive(h.TreatmentDate, h.WithdrawalDays, now));

            // ── Vaccination coverage ────────────────────────────────────────
            var latestEventByAnimal = allVaccinationEvents
                .GroupBy(v => v.AnimalId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(v => v.EventTimestamp).First());

            var animalIds = animals.Select(a => a.AnimalId).ToHashSet();

            int overdueVaccinationsCount = animalIds
                .Count(id => latestEventByAnimal.TryGetValue(id, out var ev) && ev.NextDueDate < now);

            int neverVaccinatedCount = animalIds
                .Count(id => !latestEventByAnimal.ContainsKey(id));

            var vaccinatedLast12Months = allVaccinationEvents
                .Where(v => v.EventTimestamp >= twelveMonthsAgo)
                .Select(v => v.AnimalId)
                .Distinct()
                .Count();

            double coverageRate = animals.Count > 0
                ? Math.Round((double)vaccinatedLast12Months / animals.Count * 100, 1)
                : 0;

            // ── Risk score ──────────────────────────────────────────────────
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
                UpcomingVaccinationsCount = upcomingEarTags.Count,
                UpcomingVaccinationEarTags = upcomingEarTags,
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
