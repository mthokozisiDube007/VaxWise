using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.DTOs;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnimalsController : ControllerBase
    {
        private readonly IAnimalService _animalService;

        public AnimalsController(IAnimalService animalService)
        {
            _animalService = animalService;
        }

        // GET api/animals — any logged in user
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var animals = await _animalService.GetAllAsync();
            return Ok(animals);
        }

        // GET api/animals/5 — any logged in user
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var animal = await _animalService.GetByIdAsync(id);

            if (animal == null)
                return NotFound(new { message = "Animal not found" });

            return Ok(animal);
        }

        // POST api/animals — FarmOwner and FarmManager only
        [HttpPost]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> Create([FromBody] CreateAnimalDto dto)
        {
            var animal = await _animalService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = animal.AnimalId }, animal);
        }

        // PUT api/animals/5 — FarmOwner and FarmManager only
        [HttpPut("{id}")]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAnimalDto dto)
        {
            var animal = await _animalService.UpdateAsync(id, dto);

            if (animal == null)
                return NotFound(new { message = "Animal not found" });

            return Ok(animal);
        }

        // DELETE api/animals/5 — Admin only
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _animalService.DeleteAsync(id);

            if (!result)
                return NotFound(new { message = "Animal not found" });

            return Ok(new { message = "Animal deleted successfully" });
        }
    }
}