namespace VaxWise.API.DTOs
{

    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // Admin, FarmOwner, FarmManager, Worker, Vet, Government, Inspector
        public string Role { get; set; } = string.Empty;

        // Only required if Role is "Vet"
        public string? SavcNumber { get; set; }
    }

    // What the client sends when logging in
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // What the API sends back after successful login - notice no PasswordHash
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }
}