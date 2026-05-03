namespace VaxWise.API.Models
{
    public class User
    {
        public int UserId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        // Never store plain text passwords - always hashed
        public string PasswordHash { get; set; } = string.Empty;

        // Admin, FarmOwner, FarmManager, Worker, Vet, Government, Inspector
        public string Role { get; set; } = string.Empty;

        // Only relevant for vets - stores their SAVC registration number
        public string? SavcNumber { get; set; }

        // Vet accounts require admin approval before signing events
        public bool IsVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Password reset — token is stored as SHA-256 hash; expires after 15 minutes
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
    }
}