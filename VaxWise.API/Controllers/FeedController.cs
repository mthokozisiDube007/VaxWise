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
    public class FeedController : ControllerBase
    {
        private readonly IFeedService _feedService;
        private readonly AppDbContext _context;

        public FeedController(IFeedService feedService, AppDbContext context)
        {
            _feedService = feedService;
            _context = context;
        }

        // POST api/feed/record — FarmOwner, Manager, Worker
        [HttpPost("record")]
        [Authorize(Roles = "FarmOwner,FarmManager,Worker")]
        public async Task<IActionResult> RecordFeed(
            [FromBody] CreateFeedRecordDto dto)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _feedService.RecordFeedConsumptionAsync(dto, farmId);
            return Ok(result);
        }

        // POST api/feed/stock — FarmOwner, Manager only
        [HttpPost("stock")]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> UpdateStock(
            [FromBody] UpdateFeedStockDto dto)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _feedService.UpdateFeedStockAsync(dto, farmId);
            return Ok(result);
        }

        // GET api/feed/stock — any authenticated user
        [HttpGet("stock")]
        public async Task<IActionResult> GetStockLevels()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _feedService.GetFeedStockLevelsAsync(farmId);
            return Ok(result);
        }

        // GET api/feed/records/1 — any authenticated user
        [HttpGet("records/{animalTypeId}")]
        public async Task<IActionResult> GetFeedRecords(int animalTypeId)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _feedService.GetFeedRecordsAsync(animalTypeId, farmId);
            return Ok(result);
        }

        // GET api/feed/alerts — any authenticated user
        [HttpGet("alerts")]
        public async Task<IActionResult> GetLowStockAlerts()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _feedService.GetLowStockAlertsAsync(farmId);
            return Ok(result);
        }
    }
}
