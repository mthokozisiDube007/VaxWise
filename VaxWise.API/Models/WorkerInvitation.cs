using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class WorkerInvitation
    {
        [Key]
        public int InvitationId { get; set; }

        public int FarmId { get; set; }
        public int InvitedByUserId { get; set; }

        public string Email { get; set; } = string.Empty;

        // Fixed role — Manager, Worker, Vet
        public string Role { get; set; } = string.Empty;

        // Custom title — Head Herdsman etc
        public string CustomTitle { get; set; } = string.Empty;

        // Unique token sent in the invitation email link
        public string Token { get; set; } = string.Empty;

        // Pending, Accepted, Expired
        public string Status { get; set; } = "Pending";

        // Invitation expires after 7 days
        public DateTime ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("FarmId")]
        public Farm Farm { get; set; } = null!;

        [ForeignKey("InvitedByUserId")]
        public User InvitedBy { get; set; } = null!;
    }
}