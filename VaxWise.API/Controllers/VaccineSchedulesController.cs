using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VaccineSchedulesController : ControllerBase
    {
        private readonly IVaccineScheduleService _scheduleService;

        public VaccineSchedulesController(IVaccineScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        // GET api/vaccineschedules?animalTypeId=1
        // Returns the vaccine schedule library for a given animal type
        [HttpGet]
        public async Task<IActionResult> GetByAnimalType([FromQuery] int animalTypeId)
        {
            if (animalTypeId <= 0)
                return BadRequest(new { message = "Valid animalTypeId is required." });

            var schedules = await _scheduleService.GetByAnimalTypeAsync(animalTypeId);
            return Ok(schedules);
        }
    }
}
