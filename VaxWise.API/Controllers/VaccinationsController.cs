using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Helpers;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VaccinationsController : ControllerBase
    {
        private readonly IVaccinationService _vaccinationService;
        private readonly AppDbContext _context;

        public VaccinationsController(IVaccinationService vaccinationService, AppDbContext context)
        {
            _vaccinationService = vaccinationService;
            _context = context;
        }

        [HttpPost("capture")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> Capture([FromBody] CreateVaccinationDto dto)
        {
            var savcNumber = User.FindFirst("SavcNumber")?.Value ?? string.Empty;
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _vaccinationService.CaptureAsync(dto, savcNumber, farmId);
            return CreatedAtAction(nameof(GetByAnimalId), new { animalId = result.AnimalId }, result);
        }

        [HttpPost("batch")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> BatchCapture([FromBody] BatchVaccinationDto dto)
        {
            var savcNumber = User.FindFirst("SavcNumber")?.Value ?? string.Empty;
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _vaccinationService.BatchCaptureAsync(dto, savcNumber, farmId);
            return Ok(result);
        }

        [HttpGet("animal/{animalId}")]
        public async Task<IActionResult> GetByAnimalId(int animalId)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var events = await _vaccinationService.GetByAnimalIdAsync(animalId, farmId);
            return Ok(events);
        }

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var events = await _vaccinationService.GetUpcomingAsync(farmId);
            return Ok(events);
        }

        [HttpPost("sync")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> Sync([FromBody] SyncVaccinationsDto dto)
        {
            var savcNumber = User.FindFirst("SavcNumber")?.Value ?? string.Empty;
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var results = await _vaccinationService.SyncAsync(dto, savcNumber, farmId);
            return Ok(results);
        }

        [HttpGet("herd-immunity")]
        public async Task<IActionResult> GetHerdImmunity()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var results = await _vaccinationService.GetHerdImmunityAsync(farmId);
            return Ok(results);
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var csv = await _vaccinationService.ExportCsvAsync(farmId);
            var bytes = Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", $"vaccinations-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}
