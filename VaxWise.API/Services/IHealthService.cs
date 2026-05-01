using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IHealthService
    {
        /// <summary>
        /// Records a treatment for a specific animal.
        /// Flags animal as under treatment.
        /// </summary>
        Task<HealthRecordResponseDto> RecordTreatmentAsync(CreateHealthRecordDto dto,int farmId);

        /// <summary>
        /// Returns all health records for one animal.
        /// </summary>
        Task<List<HealthRecordResponseDto>> GetAllRecordsAsync(int animalId, int farmId);

        /// <summary>
        /// Returns all animals currently under treatment.
        /// </summary>
        Task<List<HealthRecordResponseDto>> GetAllCurrentAsync(int farmId);

        /// <summary>
        /// Checks for outbreaks — fires alert if 3 or more animals
        /// show similar symptoms within 48 hours.
        /// </summary>
        Task<OutbreakAlertDto?> CheckOutbreaksAsync(string symptoms, int farmId);
    }
}