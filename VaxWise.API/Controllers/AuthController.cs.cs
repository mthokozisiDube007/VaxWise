using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VaxWise.API.DTOs;
using VaxWise.API.Services;


namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase 
    {
        // Dependency injection of the authentication service
        private readonly IAuthService _authService;
        // Constructor to inject the authentication service
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // Register endpoint to create a new user account
        [HttpPost("register")]
        [EnableRateLimiting("api")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);

            // If RegisterAsync returned null, the email already exists
            if (result == null)
                return BadRequest(new { message = "Email already registered." });

            return Ok(result);
        }
        // Login endpoint to authenticate users and return a JWT token
        [HttpPost("login")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (result == null)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(result);
        }

        // Step 1: request a password reset token (15-minute expiry)
        [HttpPost("forgot-password")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var token = await _authService.GeneratePasswordResetTokenAsync(dto.Email);

            // Always return 200 — never reveal whether the email exists
            return Ok(new
            {
                message = "If that email is registered, a reset token has been issued.",
                resetToken = token  // In production: remove this and email the token instead
            });
        }

        // Step 2: submit the token + new password to complete the reset
        [HttpPost("reset-password")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var success = await _authService.ResetPasswordAsync(dto);

            if (!success)
                return BadRequest(new { message = "Reset token is invalid or has expired." });

            return Ok(new { message = "Password reset successfully. Please log in." });
        }
    }

}