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

        public AdminController(ILoginAuditService audit)
        {
            _audit = audit;
        }

        [HttpGet("login-stats")]
        public async Task<IActionResult> GetLoginStats()
        {
            return Ok(await _audit.GetStatsAsync());
        }
    }
}
