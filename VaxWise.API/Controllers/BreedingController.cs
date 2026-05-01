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
    public class BreedingController : ControllerBase
    {
        private readonly IBreedingService _breedingService;
        private readonly AppDbContext _context;

        public BreedingController(IBreedingService breedingService, AppDbContext context)
        {
            _breedingService = breedingService;
            _context = context;
        }

        // POST api/breeding — FarmOwner, Manager
        [HttpPost]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> RecordBreeding(
            [FromBody] CreateBreedingRecordDto dto)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _breedingService.RecordBreedingAsync(dto, farmId);
            return Ok(result);
        }

        // GET api/breeding/animal/1 — any authenticated user
        [HttpGet("animal/{animalId}")]
        public async Task<IActionResult> GetBreedingHistory(int animalId)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var records = await _breedingService.GetBreedingHistoryAsync(animalId, farmId);
            return Ok(records);
        }

        // GET api/breeding/upcoming — any authenticated user
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingBirths()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var records = await _breedingService.GetUpcomingBirthsAsync(farmId);
            return Ok(records);
        }

        // POST api/breeding/1/birth — FarmOwner, Manager
        [HttpPost("{breedingRecordId}/birth")]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> RecordBirthOutcome(
            int breedingRecordId,
            [FromBody] RecordBirthOutcomeDto dto)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _breedingService.RecordBirthOutcomeAsync(breedingRecordId, dto, farmId);
            return Ok(result);
        }
    }
}
