using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public interface IFarmService
    {
        /// <summary>
        /// Creates a new farm for the logged in FarmOwner.
        /// </summary>
        Task<FarmResponseDto> CreateFarmAsync(CreateFarmDto dto, int ownerId);

        /// <summary>
        /// Returns all farms owned by the logged in FarmOwner.
        /// </summary>
        Task<List<FarmResponseDto>> GetMyFarmsAsync(int ownerId);

        /// <summary>
        /// Returns a single farm by ID.
        /// </summary>
        Task<FarmResponseDto?> GetFarmByIdAsync(int farmId, int ownerId);

        /// <summary>
        /// Updates farm details.
        /// </summary>
        Task<FarmResponseDto?> UpdateFarmAsync(int farmId, UpdateFarmDto dto, int ownerId);

        /// <summary>
        /// Sends an invitation email to a worker.
        /// Creates a WorkerInvitation record with a unique token.
        /// </summary>
        Task<string> InviteWorkerAsync(int farmId, InviteWorkerDto dto, int ownerId);

        /// <summary>
        /// Returns all workers on a specific farm.
        /// </summary>
        Task<List<FarmWorkerResponseDto>> GetFarmWorkersAsync(int farmId, int ownerId);

        /// <summary>
        /// Updates a worker's role, title, or status.
        /// </summary>
        Task<FarmWorkerResponseDto?> UpdateWorkerAsync(int farmId, int userId, UpdateWorkerDto dto, int ownerId);

        /// <summary>
        /// Removes a worker from a farm.
        /// </summary>
        Task<bool> RemoveWorkerAsync(int farmId, int userId, int ownerId);

        /// <summary>
        /// Validates an invitation token.
        /// </summary>
        Task<InvitationResponseDto?> ValidateInvitationAsync(string token);

        /// <summary>
        /// Worker accepts invitation and creates their account.
        /// </summary>
        Task<AuthResponseDto?> AcceptInvitationAsync(AcceptInvitationDto dto);
    }
}