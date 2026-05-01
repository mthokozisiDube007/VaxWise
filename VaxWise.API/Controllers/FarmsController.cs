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
    public class FarmsController : ControllerBase
    {
        private readonly IFarmService _farmService;

        public FarmsController(IFarmService farmService)
        {
            _farmService = farmService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // POST api/farms — FarmOwner only
        [HttpPost]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> CreateFarm(
            [FromBody] CreateFarmDto dto)
        {
            var result = await _farmService
                .CreateFarmAsync(dto, GetUserId());
            return Ok(result);
        }

        // GET api/farms — FarmOwner sees their farms
        [HttpGet]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetMyFarms()
        {
            var result = await _farmService
                .GetMyFarmsAsync(GetUserId());
            return Ok(result);
        }

        // GET api/farms/1
        [HttpGet("{farmId}")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetFarm(int farmId)
        {
            var result = await _farmService
                .GetFarmByIdAsync(farmId, GetUserId());

            if (result == null)
                return NotFound(new { message = "Farm not found" });

            return Ok(result);
        }

        // PUT api/farms/1
        [HttpPut("{farmId}")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> UpdateFarm(
            int farmId, [FromBody] UpdateFarmDto dto)
        {
            var result = await _farmService
                .UpdateFarmAsync(farmId, dto, GetUserId());

            if (result == null)
                return NotFound(new { message = "Farm not found" });

            return Ok(result);
        }

        // POST api/farms/1/invite — invite a worker
        [HttpPost("{farmId}/invite")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> InviteWorker(
            int farmId, [FromBody] InviteWorkerDto dto)
        {
            var invitationLink = await _farmService
                .InviteWorkerAsync(farmId, dto, GetUserId());

            return Ok(new
            {
                message = $"Invitation sent to {dto.Email}",
                invitationLink,
                note = "In production this link is sent via email. For testing use this link directly."
            });
        }

        // GET api/farms/1/workers
        [HttpGet("{farmId}/workers")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetWorkers(int farmId)
        {
            var result = await _farmService
                .GetFarmWorkersAsync(farmId, GetUserId());
            return Ok(result);
        }

        // PUT api/farms/1/workers/5 — update worker role or title
        [HttpPut("{farmId}/workers/{userId}")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> UpdateWorker(
            int farmId, int userId, [FromBody] UpdateWorkerDto dto)
        {
            var result = await _farmService
                .UpdateWorkerAsync(farmId, userId, dto, GetUserId());

            if (result == null)
                return NotFound(new { message = "Worker not found" });

            return Ok(result);
        }

        // DELETE api/farms/1/workers/5 — remove worker
        [HttpDelete("{farmId}/workers/{userId}")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> RemoveWorker(
            int farmId, int userId)
        {
            var result = await _farmService
                .RemoveWorkerAsync(farmId, userId, GetUserId());

            if (!result)
                return NotFound(new { message = "Worker not found" });

            return Ok(new { message = "Worker removed from farm" });
        }
    }
}