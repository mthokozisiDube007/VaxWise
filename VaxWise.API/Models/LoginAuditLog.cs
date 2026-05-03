using System.ComponentModel.DataAnnotations;

namespace VaxWise.API.Models
{
    public class LoginAuditLog
    {
        [Key]
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
}
