using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.DTOs;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvitationsController : ControllerBase
    {
        private readonly IFarmService _farmService;

        public InvitationsController(IFarmService farmService)
        {
            _farmService = farmService;
        }

        // GET api/invitations/{token} — validate invitation
        // Public — no auth needed
        [HttpGet("{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateInvitation(string token)
        {
            var result = await _farmService.ValidateInvitationAsync(token);

            if (result == null)
                return NotFound(new { message = "Invitation not found" });

            if (!result.IsValid)
                return BadRequest(new { message = "Invitation has expired or already been used" });

            return Ok(result);
        }

        // POST api/invitations/accept — worker accepts invitation
        // Public — no auth needed
        [HttpPost("accept")]
        [AllowAnonymous]
        public async Task<IActionResult> AcceptInvitation(
            [FromBody] AcceptInvitationDto dto)
        {
            var result = await _farmService.AcceptInvitationAsync(dto);

            if (result == null)
                return BadRequest(new { message = "Failed to accept invitation" });

            return Ok(result);
        }
    }
}