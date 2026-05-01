using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IDashboardService
    {
        /// <summary>
        /// Returns complete farm dashboard summary.
        /// Aggregates data from all modules in one call.
        /// </summary>
        Task<DashboardDto> GetDashboardAsync(int farmId);
    }
}