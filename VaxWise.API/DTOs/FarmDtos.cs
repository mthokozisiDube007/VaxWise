using System.ComponentModel.DataAnnotations;

namespace VaxWise.API.DTOs
{
    // Create a new farm
    public class CreateFarmDto
    {
        [Required]
        public string FarmName { get; set; } = string.Empty;

        // Livestock, Crops, Mixed
        [Required]
        public string FarmType { get; set; } = "Livestock";

        [Required]
        public string Province { get; set; } = string.Empty;

        public string? GpsCoordinates { get; set; }
        public string? GlnNumber { get; set; }
    }

    // Update farm details
    public class UpdateFarmDto
    {
        public string? FarmName { get; set; }
        public string? FarmType { get; set; }
        public string? Province { get; set; }
        public string? GpsCoordinates { get; set; }
        public string? GlnNumber { get; set; }
    }

    // What the API returns for a farm
    public class FarmResponseDto
    {
        public int FarmId { get; set; }
        public string FarmName { get; set; } = string.Empty;
        public string FarmType { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
        public string? GpsCoordinates { get; set; }
        public string? GlnNumber { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public int WorkerCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Invite a worker to the farm
    public class InviteWorkerDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        // Manager, Worker, Vet
        [Required]
        public string Role { get; set; } = string.Empty;

        // Head Herdsman, Irrigation Supervisor etc
        [Required]
        public string CustomTitle { get; set; } = string.Empty;
    }

    // Worker accepts invitation and sets password
    public class AcceptInvitationDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        // Optional — only for vets
        public string? SavcNumber { get; set; }
    }

    // What the API returns for a farm worker
    public class FarmWorkerResponseDto
    {
        public int FarmWorkerId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string CustomTitle { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
    }

    // Update worker role or title
    public class UpdateWorkerDto
    {
        public string? Role { get; set; }
        public string? CustomTitle { get; set; }
        public string? Status { get; set; }
    }

    // Invitation details for validation
    public class InvitationResponseDto
    {
        public int InvitationId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FarmName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string CustomTitle { get; set; } = string.Empty;
        public string InvitedByName { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsValid { get; set; }
    }
}