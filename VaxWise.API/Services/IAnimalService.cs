using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IAnimalService
    {
        Task<AnimalResponseDto> CreateAsync(CreateAnimalDto dto, int farmId);
        Task<List<AnimalResponseDto>> GetAllAsync(int farmId);
        Task<AnimalResponseDto?> GetByIdAsync(int id, int farmId);
        Task<AnimalResponseDto?> UpdateAsync(int id, UpdateAnimalDto dto, int farmId);
        Task<bool> DeleteAsync(int id, int farmId);
    }
}