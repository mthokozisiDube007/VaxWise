using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IVaccinationService
    {
        // Capture a single vaccination event — generates SHA-256 hash
        Task<VaccinationResponseDto> CaptureAsync(CreateVaccinationDto dto, string savcNumber);

        // Get all vaccination events for one animal
        Task<List<VaccinationResponseDto>> GetByAnimalIdAsync(int animalId);

        // Get all animals with vaccinations due in next 7 days
        Task<List<VaccinationResponseDto>> GetUpcomingAsync();

        // Delta-Sync — process batch of offline captured events
        Task<List<VaccinationResponseDto>> SyncAsync(SyncVaccinationsDto dto, string savcNumber);
    }
}