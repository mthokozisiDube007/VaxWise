using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class FarmWorker
    {
        [Key]
        public int FarmWorkerId { get; set; }

        public int FarmId { get; set; }
        public int UserId { get; set; }

        // Fixed system role — Manager, Worker, Vet
        public string Role { get; set; } = string.Empty;

        // Custom title — Head Herdsman, Irrigation Supervisor
        public string CustomTitle { get; set; } = string.Empty;

        // Active, Suspended, Pending
        public string Status { get; set; } = "Active";

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("FarmId")]
        public Farm Farm { get; set; } = null!;

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}