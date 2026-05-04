using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ILoginAuditService _audit;
        private readonly IAdminFarmService _adminFarm;

        public AdminController(ILoginAuditService audit, IAdminFarmService adminFarm)
        {
            _audit = audit;
            _adminFarm = adminFarm;
        }

        [HttpGet("login-stats")]
        public async Task<IActionResult> GetLoginStats()
        {
            return Ok(await _audit.GetStatsAsync());
        }

        [HttpGet("farms")]
        public async Task<IActionResult> GetAllFarms()
        {
            return Ok(await _adminFarm.GetAllFarmsAsync());
        }

        [HttpPut("farms/{farmId}/toggle")]
        public async Task<IActionResult> ToggleFarm(int farmId)
        {
            var success = await _adminFarm.ToggleFarmActiveAsync(farmId);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
