using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class FeedService : IFeedService
    {
        private readonly AppDbContext _context;

        public FeedService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<FeedRecordResponseDto> RecordFeedConsumptionAsync(
            CreateFeedRecordDto dto)
        {
            // Calculate total cost
            var totalCost = (decimal)dto.QuantityKg * dto.CostPerKg;

            var record = new FeedRecord
            {
                AnimalTypeId = dto.AnimalTypeId,
                FeedType = dto.FeedType,
                QuantityKg = dto.QuantityKg,
                CostPerKg = dto.CostPerKg,
                TotalCost = totalCost,
                FeedDate = dto.FeedDate,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.FeedRecords.Add(record);

            // Deduct from stock automatically
            var stock = await _context.FeedStocks
                .FirstOrDefaultAsync(f => f.FeedType == dto.FeedType);

            if (stock != null)
            {
                stock.CurrentStockKg -= dto.QuantityKg;
                stock.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Load animal type for response
            var animalType = await _context.AnimalTypes
                .FirstOrDefaultAsync(a => a.AnimalTypeId == dto.AnimalTypeId);

            return new FeedRecordResponseDto
            {
                FeedRecordId = record.FeedRecordId,
                AnimalTypeName = animalType?.TypeName ?? "Unknown",
                FeedType = record.FeedType,
                QuantityKg = record.QuantityKg,
                CostPerKg = record.CostPerKg,
                TotalCost = record.TotalCost,
                FeedDate = record.FeedDate,
                Notes = record.Notes
            };
        }

        public async Task<FeedStockResponseDto> UpdateFeedStockAsync(
            UpdateFeedStockDto dto)
        {
            // Check if stock entry exists for this feed type
            var stock = await _context.FeedStocks
                .FirstOrDefaultAsync(f => f.FeedType == dto.FeedType);

            if (stock == null)
            {
                // First time this feed type is added
                stock = new FeedStock
                {
                    FeedType = dto.FeedType,
                    CurrentStockKg = dto.QuantityKg,
                    CostPerKg = dto.CostPerKg,
                    LowStockThresholdKg = dto.LowStockThresholdKg,
                    LastUpdated = DateTime.UtcNow
                };
                _context.FeedStocks.Add(stock);
            }
            else
            {
                // Add to existing stock
                stock.CurrentStockKg += dto.QuantityKg;
                stock.CostPerKg = dto.CostPerKg;
                stock.LowStockThresholdKg = dto.LowStockThresholdKg;
                stock.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return MapStockToDto(stock);
        }

        public async Task<List<FeedStockResponseDto>> GetFeedStockLevelsAsync()
        {
            var stocks = await _context.FeedStocks
                .OrderBy(f => f.FeedType)
                .ToListAsync();

            return stocks.Select(MapStockToDto).ToList();
        }

        public async Task<List<FeedRecordResponseDto>> GetFeedRecordsAsync(
            int animalTypeId)
        {
            var records = await _context.FeedRecords
                .Include(f => f.AnimalType)
                .Where(f => f.AnimalTypeId == animalTypeId)
                .OrderByDescending(f => f.FeedDate)
                .ToListAsync();

            return records.Select(r => new FeedRecordResponseDto
            {
                FeedRecordId = r.FeedRecordId,
                AnimalTypeName = r.AnimalType.TypeName,
                FeedType = r.FeedType,
                QuantityKg = r.QuantityKg,
                CostPerKg = r.CostPerKg,
                TotalCost = r.TotalCost,
                FeedDate = r.FeedDate,
                Notes = r.Notes
            }).ToList();
        }

        public async Task<List<FeedStockResponseDto>> GetLowStockAlertsAsync()
        {
            // Returns only feed types below their threshold
            var lowStock = await _context.FeedStocks
                .Where(f => f.CurrentStockKg <= f.LowStockThresholdKg)
                .ToListAsync();

            return lowStock.Select(MapStockToDto).ToList();
        }

        private static FeedStockResponseDto MapStockToDto(FeedStock stock)
        {
            var isLow = stock.CurrentStockKg <= stock.LowStockThresholdKg;

            return new FeedStockResponseDto
            {
                FeedStockId = stock.FeedStockId,
                FeedType = stock.FeedType,
                CurrentStockKg = stock.CurrentStockKg,
                CostPerKg = stock.CostPerKg,
                LowStockThresholdKg = stock.LowStockThresholdKg,
                IsLowStock = isLow,
                AlertMessage = isLow
                    ? $"LOW STOCK ALERT — {stock.FeedType} is at {stock.CurrentStockKg}kg. Minimum threshold is {stock.LowStockThresholdKg}kg. Order immediately."
                    : "Stock level is adequate",
                LastUpdated = stock.LastUpdated
            };
        }
    }
}