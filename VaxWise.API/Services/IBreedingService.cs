using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IBreedingService
    {
        Task<BreedingRecordResponseDto> RecordBreedingAsync(
            CreateBreedingRecordDto dto, int farmId);

        Task<List<BreedingRecordResponseDto>> GetBreedingHistoryAsync(
            int animalId, int farmId);

        Task<List<BreedingRecordResponseDto>> GetUpcomingBirthsAsync(int farmId);

        Task<BirthOutcomeResponseDto> RecordBirthOutcomeAsync(
            int breedingRecordId, RecordBirthOutcomeDto dto, int farmId);
    }
}
