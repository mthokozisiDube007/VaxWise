using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;
using Microsoft.Extensions.Logging;
namespace VaxWise.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;

        // Dependency injection - the context and config are provided by .NET 10
        public AuthService(
         AppDbContext context,
         IConfiguration config,
         ILogger<AuthService> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
        {
            // Only FarmOwner can self-register
            // All other roles must be invited by a FarmOwner
            if (dto.Role != "FarmOwner" && dto.Role != "Admin")
                throw new Exception(
                    "Only Farm Owners can self-register. Workers must be invited by a Farm Owner.");

            bool emailExists = await _context.Users
                .AnyAsync(u => u.Email == dto.Email);

            if (emailExists) return null;

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                PasswordHash = passwordHash,
                Role = dto.Role,
                SavcNumber = dto.SavcNumber,
                IsVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return GenerateTokenResponse(user);
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null ||
                !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                // Log failed login attempt — security event
                _logger.LogWarning(
                    "Failed login attempt for email {Email} at {Time}",
                    dto.Email,
                    DateTime.UtcNow);

                return null;
            }
            // Log successful login
            _logger.LogInformation(
                "Successful login for user {UserId} with role {Role} at {Time}",
                user.UserId,
                user.Role,
                DateTime.UtcNow);

            return GenerateTokenResponse(user);
        }

        private AuthResponseDto GenerateTokenResponse(User user)
        {
            var expiry = DateTime.UtcNow.AddHours(
                _config.GetValue<int>("JwtSettings:ExpiryHours"));

            string token = GenerateJwtToken(user, expiry);

            return new AuthResponseDto
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                ExpiresAt = expiry
            };
        }

        private string GenerateJwtToken(User user, DateTime expiry)
        {
            // The secret key used to sign the token - only the server knows this
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!));

            var credentials = new SigningCredentials(
                key, SecurityAlgorithms.HmacSha256);

            // Claims are the pieces of information embedded inside the token
            // The client can read these but cannot change them without breaking the signature
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role),

                // VaxWise-specific claim for vet signing privileges
                new Claim("IsVerified", user.IsVerified.ToString()),
                new Claim("SavcNumber", user.SavcNumber ?? "")
            };

            var token = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"],
                audience: _config["JwtSettings:Audience"],
                claims: claims,
                expires: expiry,
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}