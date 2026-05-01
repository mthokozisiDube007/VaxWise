using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.DTOs;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BreedingController : ControllerBase
    {
        private readonly IBreedingService _breedingService;

        public BreedingController(IBreedingService breedingService)
        {
            _breedingService = breedingService;
        }

        // POST api/breeding — FarmOwner, Manager
        [HttpPost]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> RecordBreeding(
            [FromBody] CreateBreedingRecordDto dto)
        {
            var result = await _breedingService.RecordBreedingAsync(dto);
            return Ok(result);
        }

        // GET api/breeding/animal/1 — any authenticated user
        [HttpGet("animal/{animalId}")]
        public async Task<IActionResult> GetBreedingHistory(int animalId)
        {
            var records = await _breedingService
                .GetBreedingHistoryAsync(animalId);
            return Ok(records);
        }

        // GET api/breeding/upcoming — any authenticated user
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingBirths()
        {
            var records = await _breedingService.GetUpcomingBirthsAsync();
            return Ok(records);
        }

        // POST api/breeding/1/birth — FarmOwner, Manager
        [HttpPost("{breedingRecordId}/birth")]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> RecordBirthOutcome(
            int breedingRecordId,
            [FromBody] RecordBirthOutcomeDto dto)
        {
            var result = await _breedingService
                .RecordBirthOutcomeAsync(breedingRecordId, dto);
            return Ok(result);
        }
    }
}