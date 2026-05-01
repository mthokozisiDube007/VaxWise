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
    public class HealthController : ControllerBase
    {
        private readonly IHealthService _healthService;
        private readonly AppDbContext _context;

        public HealthController(IHealthService healthService, AppDbContext context)
        {
            _healthService = healthService;
            _context = context;
        }

        // POST api/health/treatment — Vet only
        [HttpPost("treatment")]
        [Authorize(Roles = "Vet")]
        public async Task<IActionResult> RecordTreatment(
            [FromBody] CreateHealthRecordDto dto)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _healthService.RecordTreatmentAsync(dto, farmId);
            return Ok(result);
        }

        // GET api/health/animal/1 — any authenticated user
        [HttpGet("animal/{animalId}")]
        public async Task<IActionResult> GetAllRecords(int animalId)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var records = await _healthService.GetAllRecordsAsync(animalId, farmId);
            return Ok(records);
        }

        // GET api/health/current — any authenticated user
        [HttpGet("current")]
        public async Task<IActionResult> GetAllCurrent()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var records = await _healthService.GetAllCurrentAsync(farmId);
            return Ok(records);
        }

        // GET api/health/outbreak?symptoms=FMD — any authenticated user
        [HttpGet("outbreak")]
        public async Task<IActionResult> CheckOutbreak(
            [FromQuery] string symptoms)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var alert = await _healthService.CheckOutbreaksAsync(symptoms, farmId);
            return Ok(alert);
        }
    }
}
