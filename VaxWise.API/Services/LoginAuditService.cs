using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class LoginAuditService : ILoginAuditService
    {
        private readonly AppDbContext _context;

        public LoginAuditService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(string email, bool success, string ipAddress, string userAgent,
                                   int responseTimeMs, string? failureReason = null, string? role = null)
        {
            _context.LoginAuditLogs.Add(new LoginAuditLog
            {
                Email = email,
                Success = success,
                IpAddress = ipAddress,
                UserAgent = userAgent.Length > 250 ? userAgent[..250] : userAgent,
                ResponseTimeMs = responseTimeMs,
                FailureReason = failureReason,
                Role = role,
                AttemptedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        public async Task<LoginStatsDto> GetStatsAsync()
        {
            var now = DateTime.UtcNow;
            var cutoff24h = now.AddHours(-24);
            var cutoff7d = now.AddDays(-7);

            var logs24h = await _context.LoginAuditLogs
                .AsNoTracking()
                .Where(l => l.AttemptedAt >= cutoff24h)
                .ToListAsync();

            var logs7d = await _context.LoginAuditLogs
                .AsNoTracking()
                .Where(l => l.AttemptedAt >= cutoff7d)
                .ToListAsync();

            // 100 most recent logs for the table
            var recent = await _context.LoginAuditLogs
                .AsNoTracking()
                .OrderByDescending(l => l.AttemptedAt)
                .Take(100)
                .Select(l => new RecentLoginLogDto
                {
                    LogId = l.LogId,
                    Email = l.Email,
                    Success = l.Success,
                    IpAddress = l.IpAddress,
                    UserAgent = l.UserAgent,
                    ResponseTimeMs = l.ResponseTimeMs,
                    FailureReason = l.FailureReason,
                    Role = l.Role,
                    AttemptedAt = l.AttemptedAt
                })
                .ToListAsync();

            // 24h stats
            int total24h = logs24h.Count;
            int success24h = logs24h.Count(l => l.Success);
            int failed24h = total24h - success24h;
            double rate24h = total24h > 0 ? Math.Round((double)success24h / total24h * 100, 1) : 0;
            double avgMs24h = total24h > 0 ? Math.Round(logs24h.Average(l => l.ResponseTimeMs), 1) : 0;
            int peakMs24h = total24h > 0 ? logs24h.Max(l => l.ResponseTimeMs) : 0;

            // 7d stats
            int total7d = logs7d.Count;
            int success7d = logs7d.Count(l => l.Success);
            int failed7d = total7d - success7d;
            double rate7d = total7d > 0 ? Math.Round((double)success7d / total7d * 100, 1) : 0;
            double avgMs7d = total7d > 0 ? Math.Round(logs7d.Average(l => l.ResponseTimeMs), 1) : 0;
            int unique7d = logs7d.Where(l => l.Success).Select(l => l.Email).Distinct().Count();

            // Hourly breakdown — fill all 24 slots even if empty
            var byHour = logs24h
                .GroupBy(l => l.AttemptedAt.Hour)
                .ToDictionary(g => g.Key, g => g.ToList());

            var hourly = Enumerable.Range(0, 24).Select(h => new HourlyLoginCount
            {
                Hour = h,
                Total = byHour.TryGetValue(h, out var g) ? g.Count : 0,
                Successful = byHour.TryGetValue(h, out var gs) ? gs.Count(l => l.Success) : 0,
                Failed = byHour.TryGetValue(h, out var gf) ? gf.Count(l => !l.Success) : 0,
            }).ToList();

            return new LoginStatsDto
            {
                TotalLogins24h = total24h,
                SuccessfulLogins24h = success24h,
                FailedLogins24h = failed24h,
                SuccessRate24h = rate24h,
                AvgResponseTimeMs24h = avgMs24h,
                PeakResponseTimeMs24h = peakMs24h,
                TotalLogins7d = total7d,
                SuccessfulLogins7d = success7d,
                FailedLogins7d = failed7d,
                SuccessRate7d = rate7d,
                AvgResponseTimeMs7d = avgMs7d,
                UniqueUsers7d = unique7d,
                HourlyBreakdown24h = hourly,
                RecentLogs = recent,
            };
        }
    }
}
