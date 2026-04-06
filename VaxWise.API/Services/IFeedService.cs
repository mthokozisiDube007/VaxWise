using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IFeedService
    {
        /// <summary>
        /// Records daily feed consumption for an animal group.
        /// </summary>
        Task<FeedRecordResponseDto> RecordFeedConsumptionAsync(
            CreateFeedRecordDto dto);

        /// <summary>
        /// Updates feed stock when new feed arrives on the farm.
        /// </summary>
        Task<FeedStockResponseDto> UpdateFeedStockAsync(
            UpdateFeedStockDto dto);

        /// <summary>
        /// Returns current stock levels for all feed types.
        /// </summary>
        Task<List<FeedStockResponseDto>> GetFeedStockLevelsAsync();

        /// <summary>
        /// Returns all daily feed consumption records.
        /// </summary>
        Task<List<FeedRecordResponseDto>> GetFeedRecordsAsync(
            int animalTypeId);

        /// <summary>
        /// Returns all feed types where stock is below threshold.
        /// Drives dashboard low stock alerts.
        /// </summary>
        Task<List<FeedStockResponseDto>> GetLowStockAlertsAsync();
    }
}