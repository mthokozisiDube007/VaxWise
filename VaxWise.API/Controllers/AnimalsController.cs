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
    public class AnimalsController : ControllerBase
    {
        private readonly IAnimalService _animalService;
        private readonly AppDbContext _context;

        public AnimalsController(IAnimalService animalService, AppDbContext context)
        {
            _animalService = animalService;
            _context = context;
        }

        private async Task<int> GetFarmId() =>
            await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var farmId = await GetFarmId();
            var result = await _animalService.GetAllAsync(farmId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var farmId = await GetFarmId();
            var result = await _animalService.GetByIdAsync(id, farmId);
            if (result == null) return NotFound(new { message = "Animal not found" });
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> Create([FromBody] CreateAnimalDto dto)
        {
            var farmId = await GetFarmId();
            var result = await _animalService.CreateAsync(dto, farmId);
            return CreatedAtAction(nameof(GetById), new { id = result.AnimalId }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAnimalDto dto)
        {
            var farmId = await GetFarmId();
            var result = await _animalService.UpdateAsync(id, dto, farmId);
            if (result == null) return NotFound(new { message = "Animal not found" });
            return Ok(result);
        }

        [HttpPatch("{id}/weight")]
        [Authorize(Roles = "FarmOwner,FarmManager,FarmWorker")]
        public async Task<IActionResult> UpdateWeight(int id, [FromBody] UpdateWeightDto dto)
        {
            var farmId = await GetFarmId();
            var animal = await _context.Animals.FindAsync(id);
            if (animal == null || animal.FarmId != farmId)
                return NotFound(new { message = "Animal not found" });
            animal.CurrentWeightKg = dto.WeightKg;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Weight updated", weightKg = animal.CurrentWeightKg });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var farmId = await GetFarmId();
            var result = await _animalService.DeleteAsync(id, farmId);
            if (!result) return NotFound(new { message = "Animal not found" });
            return Ok(new { message = "Animal deleted" });
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv()
        {
            var farmId = await GetFarmId();
            var csv = await _animalService.ExportCsvAsync(farmId);
            var bytes = Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", $"animals-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}