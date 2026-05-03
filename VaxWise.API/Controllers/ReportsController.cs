using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.Data;
using VaxWise.API.Helpers;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly AppDbContext _context;

        public ReportsController(IReportService reportService, AppDbContext context)
        {
            _reportService = reportService;
            _context = context;
        }

        // GET api/reports/dalrrd
        // Generates a DALRRD-compliant PDF report for the active notifiable outbreak on this farm.
        // Returns 404 if no notifiable disease is detected in the last 48 hours.
        [HttpGet("dalrrd")]
        public async Task<IActionResult> GetDalrrdReport()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var pdf = await _reportService.GenerateDalrrdReportAsync(farmId);

            if (pdf == null)
                return NotFound(new { message = "No active notifiable disease outbreak detected in the last 48 hours." });

            var fileName = $"DALRRD-Report-{DateTime.UtcNow:yyyyMMdd-HHmm}.pdf";
            return File(pdf, "application/pdf", fileName);
        }
    }
}
