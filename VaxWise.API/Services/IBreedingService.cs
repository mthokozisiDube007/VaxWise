using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IBreedingService
    {
        /// <summary>
        /// Records a breeding event between female and male animal.
        /// Automatically calculates expected birth date from gestation period.
        /// </summary>
        Task<BreedingRecordResponseDto> RecordBreedingAsync(
            CreateBreedingRecordDto dto);

        /// <summary>
        /// Returns full breeding history for one animal.
        /// </summary>
        Task<List<BreedingRecordResponseDto>> GetBreedingHistoryAsync(
            int animalId);

        /// <summary>
        /// Returns all animals with expected births in next 14 days.
        /// Drives dashboard breeding alerts.
        /// </summary>
        Task<List<BreedingRecordResponseDto>> GetUpcomingBirthsAsync();

        /// <summary>
        /// Records birth outcome — number of offspring,
        /// birth weight, and survival status.
        /// Automatically registers offspring as new animals.
        /// </summary>
        Task<BirthOutcomeResponseDto> RecordBirthOutcomeAsync(
            int breedingRecordId, RecordBirthOutcomeDto dto);
    }
}