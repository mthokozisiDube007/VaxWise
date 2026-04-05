using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VaxWise.API.DTOs;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VaccinationsController : ControllerBase
    {
        private readonly IVaccinationService _vaccinationService;

        public VaccinationsController(IVaccinationService vaccinationService)
        {
            _vaccinationService = vaccinationService;
        }

        // POST api/vaccinations/capture — Vet only
        [HttpPost("capture")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> Capture([FromBody] CreateVaccinationDto dto)
        {
            // Read SAVC number from the JWT token
            // The vet cannot fake this — it comes from their verified token
            var savcNumber = User.FindFirst("SavcNumber")?.Value ?? string.Empty;

            var result = await _vaccinationService.CaptureAsync(dto, savcNumber);
            return CreatedAtAction(nameof(GetByAnimalId),
                new { animalId = result.AnimalId }, result);
        }

        // GET api/vaccinations/animal/1 — any authenticated user
        [HttpGet("animal/{animalId}")]
        public async Task<IActionResult> GetByAnimalId(int animalId)
        {
            var events = await _vaccinationService.GetByAnimalIdAsync(animalId);
            return Ok(events);
        }

        // GET api/vaccinations/upcoming — any authenticated user
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming()
        {
            var events = await _vaccinationService.GetUpcomingAsync();
            return Ok(events);
        }

        // POST api/vaccinations/sync — Vet only
        [HttpPost("sync")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> Sync([FromBody] SyncVaccinationsDto dto)
        {
            var savcNumber = User.FindFirst("SavcNumber")?.Value ?? string.Empty;

            var results = await _vaccinationService.SyncAsync(dto, savcNumber);
            return Ok(results);
        }
    }
}