using Microsoft.AspNetCore.Mvc;
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
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            // If LoginAsync returned null, credentials were invalid
            if (result == null)
                return Unauthorized(new { message = "Invalid email or password." });

            return Ok(result);
        }
    }
}