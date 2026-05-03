namespace VaxWise.API.DTOs
{
    public class RecentLoginLogDto
    {
        public int LogId { get; set; }
        public string Email { get; set; } = "";
        public bool Success { get; set; }
        public string IpAddress { get; set; } = "";
        public string UserAgent { get; set; } = "";
        public int ResponseTimeMs { get; set; }
        public string? FailureReason { get; set; }
        public string? Role { get; set; }
        public DateTime AttemptedAt { get; set; }
    }

    public class HourlyLoginCount
    {
        public int Hour { get; set; }         // 0–23
        public int Total { get; set; }
        public int Successful { get; set; }
        public int Failed { get; set; }
    }

    public class LoginStatsDto
    {
        // 24-hour window
        public int TotalLogins24h { get; set; }
        public int SuccessfulLogins24h { get; set; }
        public int FailedLogins24h { get; set; }
        public double SuccessRate24h { get; set; }
        public double AvgResponseTimeMs24h { get; set; }
        public int PeakResponseTimeMs24h { get; set; }

        // 7-day window
        public int TotalLogins7d { get; set; }
        public int SuccessfulLogins7d { get; set; }
        public int FailedLogins7d { get; set; }
        public double SuccessRate7d { get; set; }
        public double AvgResponseTimeMs7d { get; set; }
        public int UniqueUsers7d { get; set; }

        public List<HourlyLoginCount> HourlyBreakdown24h { get; set; } = new();
        public List<RecentLoginLogDto> RecentLogs { get; set; } = new();
    }
}
