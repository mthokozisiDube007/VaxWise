using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IFeedService
    {
        Task<FeedRecordResponseDto> RecordFeedConsumptionAsync(
            CreateFeedRecordDto dto, int farmId);

        Task<FeedStockResponseDto> UpdateFeedStockAsync(
            UpdateFeedStockDto dto, int farmId);

        Task<List<FeedStockResponseDto>> GetFeedStockLevelsAsync(int farmId);

        Task<List<FeedRecordResponseDto>> GetFeedRecordsAsync(
            int animalTypeId, int farmId);

        Task<List<FeedStockResponseDto>> GetLowStockAlertsAsync(int farmId);
    }
}
