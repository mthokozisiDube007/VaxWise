using System.Diagnostics;
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
        private readonly IAuthService _authService;
        private readonly ILoginAuditService _audit;

        public AuthController(IAuthService authService, ILoginAuditService audit)
        {
            _authService = authService;
            _audit = audit;
        }

        [HttpPost("register")]
        [EnableRateLimiting("api")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result == null)
                return BadRequest(new { message = "Email already registered." });
            return Ok(result);
        }

        [HttpPost("login")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var sw = Stopwatch.StartNew();
            var result = await _authService.LoginAsync(dto);
            sw.Stop();

            var ip = Request.Headers["X-Forwarded-For"].FirstOrDefault()
                     ?? HttpContext.Connection.RemoteIpAddress?.ToString()
                     ?? "Unknown";
            var ua = Request.Headers["User-Agent"].ToString();

            // Fire-and-forget audit log — does not affect response time
            _ = _audit.LogAsync(
                email: dto.Email,
                success: result != null,
                ipAddress: ip,
                userAgent: ua,
                responseTimeMs: (int)sw.ElapsedMilliseconds,
                failureReason: result == null ? "Invalid credentials" : null,
                role: result?.Role
            );

            if (result == null)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(result);
        }

        [HttpPost("forgot-password")]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var token = await _authService.GeneratePasswordResetTokenAsync(dto.Email);
            return Ok(new
            {
                message = "If that email is registered, a reset token has been issued.",
                resetToken = token
            });
        }

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
