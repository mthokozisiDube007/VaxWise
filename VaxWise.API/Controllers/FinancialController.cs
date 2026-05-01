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
    public class FinancialController : ControllerBase
    {
        private readonly IFinancialService _financialService;
        private readonly AppDbContext _context;

        public FinancialController(IFinancialService financialService, AppDbContext context)
        {
            _financialService = financialService;
            _context = context;
        }

        // POST api/financial/income — FarmOwner only
        [HttpPost("income")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> RecordIncome(
            [FromBody] CreateIncomeDto dto)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _financialService.RecordIncomeAsync(dto, farmId);
            return Ok(result);
        }

        // POST api/financial/expense — FarmOwner, Manager
        [HttpPost("expense")]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> RecordExpense(
            [FromBody] CreateExpenseDto dto)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _financialService.RecordExpenseAsync(dto, farmId);
            return Ok(result);
        }

        // GET api/financial/profit-loss?month=4&year=2026
        [HttpGet("profit-loss")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetProfitLoss(
            [FromQuery] int month,
            [FromQuery] int year)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _financialService.GetMonthlyProfitLossAsync(month, year, farmId);
            return Ok(result);
        }

        // GET api/financial/transactions — FarmOwner only
        [HttpGet("transactions")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetAllTransactions()
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _financialService.GetAllTransactionsAsync(farmId);
            return Ok(result);
        }

        // GET api/financial/animal/1/cost — FarmOwner only
        [HttpGet("animal/{animalId}/cost")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetAnimalCost(int animalId)
        {
            var farmId = await FarmContextHelper.GetActiveFarmIdAsync(User, Request, _context);
            var result = await _financialService.GetAnimalCostAsync(animalId, farmId);
            return Ok(result);
        }
    }
}
