using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class Certificate
    {
        [Key]
        public int CertId { get; set; }

        // Links to the vaccination event this cert was generated from
        public int EventId { get; set; }

        // Links to the farmer who owns this certificate
        public int FarmerId { get; set; }

        public string AuditHash { get; set; } = string.Empty;
        public string QrCodeUrl { get; set; } = string.Empty;

        // Valid, Expired, Tampered
        public string Status { get; set; } = "Valid";

        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

        // Certificates expire after 30 days
        public DateTime ExpiresAt { get; set; }

        // Navigation properties
        [ForeignKey("EventId")]
        public VaccinationEvent VaccinationEvent { get; set; } = null!;
    }
}