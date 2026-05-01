using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VaxWise.API.DTOs;
using VaxWise.API.Services;

namespace VaxWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FinancialController : ControllerBase
    {
        private readonly IFinancialService _financialService;

        public FinancialController(IFinancialService financialService)
        {
            _financialService = financialService;
        }

        // POST api/financial/income — FarmOwner only
        [HttpPost("income")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> RecordIncome(
            [FromBody] CreateIncomeDto dto)
        {
            var result = await _financialService.RecordIncomeAsync(dto);
            return Ok(result);
        }

        // POST api/financial/expense — FarmOwner, Manager
        [HttpPost("expense")]
        [Authorize(Roles = "FarmOwner,FarmManager")]
        public async Task<IActionResult> RecordExpense(
            [FromBody] CreateExpenseDto dto)
        {
            var result = await _financialService.RecordExpenseAsync(dto);
            return Ok(result);
        }

        // GET api/financial/profit-loss?month=4&year=2026
        [HttpGet("profit-loss")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetProfitLoss(
            [FromQuery] int month,
            [FromQuery] int year)
        {
            var result = await _financialService
                .GetMonthlyProfitLossAsync(month, year);
            return Ok(result);
        }

        // GET api/financial/transactions — FarmOwner only
        [HttpGet("transactions")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetAllTransactions()
        {
            var result = await _financialService.GetAllTransactionsAsync();
            return Ok(result);
        }

        // GET api/financial/animal/1/cost — FarmOwner only
        [HttpGet("animal/{animalId}/cost")]
        [Authorize(Roles = "FarmOwner")]
        public async Task<IActionResult> GetAnimalCost(int animalId)
        {
            var result = await _financialService.GetAnimalCostAsync(animalId);
            return Ok(result);
        }
    }
}