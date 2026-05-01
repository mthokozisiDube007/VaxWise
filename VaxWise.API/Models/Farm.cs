using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VaxWise.API.Models
{
    public class Farm
    {
        [Key]
        public int FarmId { get; set; }

        [Required]
        public string FarmName { get; set; } = string.Empty;

        // Livestock, Crops, Mixed
        public string FarmType { get; set; } = "Livestock";

        public string Province { get; set; } = string.Empty;

        // Optional GPS coordinates
        public string? GpsCoordinates { get; set; }

        // Farm GLN number for DALRRD compliance
        public string? GlnNumber { get; set; }

        // The FarmOwner who owns this farm
        public int OwnerId { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("OwnerId")]
        public User Owner { get; set; } = null!;

        // Navigation — one farm has many workers
        public ICollection<FarmWorker> Workers { get; set; } = new List<FarmWorker>();
    }
}