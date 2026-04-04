using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IAnimalService
    {
        Task<AnimalResponseDto> CreateAsync(CreateAnimalDto dto);
        Task<List<AnimalResponseDto>> GetAllAsync();
        Task<AnimalResponseDto?> GetByIdAsync(int id);
        Task<AnimalResponseDto?> UpdateAsync(int id, UpdateAnimalDto dto);
        Task<bool> DeleteAsync(int id);
    }
}