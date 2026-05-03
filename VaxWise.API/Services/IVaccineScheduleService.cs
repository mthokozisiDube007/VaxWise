using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IVaccineScheduleService
    {
        Task<List<VaccineScheduleDto>> GetByAnimalTypeAsync(int animalTypeId);
        Task<VaccineScheduleDto?> GetByVaccineNameAsync(string vaccineName, int animalTypeId);
    }
}
