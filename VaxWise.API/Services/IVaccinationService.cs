using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IVaccinationService
    {
        Task<VaccinationResponseDto> CaptureAsync(CreateVaccinationDto dto, string savcNumber, int farmId);
        Task<List<VaccinationResponseDto>> GetByAnimalIdAsync(int animalId, int farmId);
        Task<List<VaccinationResponseDto>> GetUpcomingAsync(int farmId);
        Task<List<VaccinationResponseDto>> SyncAsync(SyncVaccinationsDto dto, string savcNumber, int farmId);
        Task<BatchVaccinationResultDto> BatchCaptureAsync(BatchVaccinationDto dto, string savcNumber, int farmId);
        Task<List<HerdImmunityResultDto>> GetHerdImmunityAsync(int farmId);
        Task<string> ExportCsvAsync(int farmId);
    }
}
