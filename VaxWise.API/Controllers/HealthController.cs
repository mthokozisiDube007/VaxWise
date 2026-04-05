using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.DTOs;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HealthController : ControllerBase
    {
        private readonly IHealthService _healthService;

        public HealthController(IHealthService healthService)
        {
            _healthService = healthService;
        }

        // POST api/health/treatment — Vet only
        [HttpPost("treatment")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> RecordTreatment(
            [FromBody] CreateHealthRecordDto dto)
        {
            var result = await _healthService.RecordTreatmentAsync(dto);
            return Ok(result);
        }

        // GET api/health/animal/1 — any authenticated user
        [HttpGet("animal/{animalId}")]
        public async Task<IActionResult> GetAllRecords(int animalId)
        {
            var records = await _healthService.GetAllRecordsAsync(animalId);
            return Ok(records);
        }

        // GET api/health/current — any authenticated user
        [HttpGet("current")]
        public async Task<IActionResult> GetAllCurrent()
        {
            var records = await _healthService.GetAllCurrentAsync();
            return Ok(records);
        }

        // GET api/health/outbreak?symptoms=FMD — any authenticated user
        [HttpGet("outbreak")]
        public async Task<IActionResult> CheckOutbreak(
            [FromQuery] string symptoms)
        {
            var alert = await _healthService.CheckOutbreaksAsync(symptoms);
            return Ok(alert);
        }
    }
}