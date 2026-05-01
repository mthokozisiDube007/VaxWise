using Microsoft.EntityFrameworkCore;
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
            var fourteenDaysFromNow = now.AddDays(14);
            var today = now.Date;
            var currentMonth = now.Month;
            var currentYear = now.Year;

            // All queries now filter by farmId
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

            var recentSymptoms = await _context.HealthRecords
                .Where(h =>
                    h.FarmId == farmId &&
                    h.TreatmentDate >= now.AddHours(-48))
                .GroupBy(h => h.Symptoms)
                .Where(g => g.Count() >= 3)
                .AnyAsync();

            var lowStockItems = await _context.FeedStocks
                .Where(f =>
                    f.FarmId == farmId &&
                    f.CurrentStockKg <= f.LowStockThresholdKg)
                .ToListAsync();

            var upcomingBirths = await _context.BreedingRecords
                .Include(b => b.FemaleAnimal)
                .CountAsync(b =>
                    b.FemaleAnimal.FarmId == farmId &&
                    b.ExpectedBirthDate.Date <= fourteenDaysFromNow &&
                    b.ExpectedBirthDate.Date >= today &&
                    b.Status != "Delivered");

            var monthlyTransactions = await _context.Financials
                .Where(f =>
                    f.FarmId == farmId &&
                    f.TransactionDate.Month == currentMonth &&
                    f.TransactionDate.Year == currentYear)
                .ToListAsync();

            var totalIncome = monthlyTransactions.Where(t => t.TransactionType == "Income").Sum(t => t.Amount);
            var totalExpenses = monthlyTransactions.Where(t => t.TransactionType == "Expense").Sum(t => t.Amount);
            var netProfit = totalIncome - totalExpenses;

            var totalCertificates = await _context.Certificates
                .Include(c => c.VaccinationEvent)
                .CountAsync(c => c.VaccinationEvent.FarmId == farmId);

            var totalVaccinations = await _context.VaccinationEvents
                .CountAsync(v => v.FarmId == farmId);

            return new DashboardDto
            {
                TotalAnimals = animals.Count,
                ActiveAnimals = animals.Count(a => a.Status == "Active"),
                AnimalsUnderTreatment = animals.Count(a => a.Status == "UnderTreatment"),
                QuarantinedAnimals = animals.Count(a => a.Status == "Quarantined"),
                AverageComplianceScore = animals.Count > 0 ? (int)animals.Average(a => a.ComplianceScore) : 0,
                UpcomingVaccinationsCount = upcomingVaccinations.Count,
                UpcomingVaccinationEarTags = upcomingVaccinations.Select(v => v.Animal.EarTagNumber).ToList(),
                AnimalsCurrentlyUnderTreatment = currentlyUnderTreatment,
                ActiveOutbreakDetected = recentSymptoms,
                LowStockAlertCount = lowStockItems.Count,
                LowStockFeedTypes = lowStockItems.Select(f => f.FeedType).ToList(),
                UpcomingBirthsCount = upcomingBirths,
                TotalIncomeThisMonth = totalIncome,
                TotalExpensesThisMonth = totalExpenses,
                NetProfitThisMonth = netProfit,
                IsProfitableThisMonth = netProfit > 0,
                TotalCertificatesIssued = totalCertificates,
                TotalVaccinationEvents = totalVaccinations,
                GeneratedAt = now
            };
        }
    }
}