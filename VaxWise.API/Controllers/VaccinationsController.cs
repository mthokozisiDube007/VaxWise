using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        // POST api/vaccinations/capture — Vet only
        [HttpPost("capture")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> Capture([FromBody] CreateVaccinationDto dto)
        {
            var savcNumber = User.FindFirst("SavcNumber")?.Value ?? string.Empty;
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);

            var result = await _vaccinationService.CaptureAsync(dto, savcNumber, farmId);
            return CreatedAtAction(nameof(GetByAnimalId),
                new { animalId = result.AnimalId }, result);
        }

        // GET api/vaccinations/animal/1 — any authenticated user
        [HttpGet("animal/{animalId}")]
        public async Task<IActionResult> GetByAnimalId(int animalId)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var events = await _vaccinationService.GetByAnimalIdAsync(animalId, farmId);
            return Ok(events);
        }

        // GET api/vaccinations/upcoming — any authenticated user
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var events = await _vaccinationService.GetUpcomingAsync(farmId);
            return Ok(events);
        }

        // POST api/vaccinations/sync — Vet only
        [HttpPost("sync")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> Sync([FromBody] SyncVaccinationsDto dto)
        {
            var savcNumber = User.FindFirst("SavcNumber")?.Value ?? string.Empty;
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);

            var results = await _vaccinationService.SyncAsync(dto, savcNumber, farmId);
            return Ok(results);
        }
    }
}
