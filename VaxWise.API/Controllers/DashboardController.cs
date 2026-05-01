using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VaxWise.API.Helpers;
using VaxWise.API.Services;
using VaxWise.API.Data;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly AppDbContext _context;

        public DashboardController(IDashboardService dashboardService,AppDbContext context)
        {
            _dashboardService = dashboardService;
            _context = context;
        }

        // GET api/dashboard — any authenticated user
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var farmId = await FarmContextHelper
                .GetActiveFarmIdAsync(User, Request, _context);
            var result = await _dashboardService.GetDashboardAsync(farmId);
            return Ok(result);
        }
    }
}