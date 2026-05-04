using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public class AdminFarmService : IAdminFarmService
    {
        private readonly AppDbContext _context;

        public AdminFarmService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<AdminFarmDto>> GetAllFarmsAsync()
        {
            var farms = await _context.Farms
                .AsNoTracking()
                .Include(f => f.Owner)
                .Include(f => f.Workers)
                .OrderBy(f => f.FarmName)
                .ToListAsync();

            // Single query for all animal counts and compliance scores
            var animalStats = await _context.Animals
                .AsNoTracking()
                .GroupBy(a => a.FarmId)
                .Select(g => new
                {
                    FarmId = g.Key,
                    Count = g.Count(),
                    AvgCompliance = g.Average(a => (double)a.ComplianceScore)
                })
                .ToDictionaryAsync(x => x.FarmId);

            return farms.Select(farm =>
            {
                animalStats.TryGetValue(farm.FarmId, out var stats);
                return new AdminFarmDto
                {
                    FarmId = farm.FarmId,
                    FarmName = farm.FarmName,
                    FarmType = farm.FarmType,
                    Province = farm.Province,
                    GlnNumber = farm.GlnNumber,
                    OwnerName = farm.Owner.FullName,
                    OwnerEmail = farm.Owner.Email,
                    AnimalCount = stats?.Count ?? 0,
                    WorkerCount = farm.Workers?.Count ?? 0,
                    AverageComplianceScore = stats != null ? Math.Round(stats.AvgCompliance, 1) : 0,
                    IsActive = farm.IsActive,
                    CreatedAt = farm.CreatedAt
                };
            }).ToList();
        }

        public async Task<bool> ToggleFarmActiveAsync(int farmId)
        {
            var farm = await _context.Farms.FindAsync(farmId);
            if (farm == null) return false;

            farm.IsActive = !farm.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
