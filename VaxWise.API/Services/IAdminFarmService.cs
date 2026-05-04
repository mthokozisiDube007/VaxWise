using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IAdminFarmService
    {
        Task<List<AdminFarmDto>> GetAllFarmsAsync();
        Task<bool> ToggleFarmActiveAsync(int farmId);
    }
}
