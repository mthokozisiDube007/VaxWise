using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface ILoginAuditService
    {
        Task LogAsync(string email, bool success, string ipAddress, string userAgent,
                      int responseTimeMs, string? failureReason = null, string? role = null);

        Task<LoginStatsDto> GetStatsAsync();
    }
}
