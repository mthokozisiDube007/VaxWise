using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class FarmService : IFarmService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IAuthService _authService;

        public FarmService(
            AppDbContext context,
            IConfiguration config,
            IAuthService authService)
        {
            _context = context;
            _config = config;
            _authService = authService;
        }

        public async Task<FarmResponseDto> CreateFarmAsync(
            CreateFarmDto dto, int ownerId)
        {
            var farm = new Farm
            {
                FarmName = dto.FarmName,
                FarmType = dto.FarmType,
                Province = dto.Province,
                GpsCoordinates = dto.GpsCoordinates,
                GlnNumber = dto.GlnNumber,
                OwnerId = ownerId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Farms.Add(farm);
            await _context.SaveChangesAsync();

            return await MapFarmToDto(farm);
        }

        public async Task<List<FarmResponseDto>> GetMyFarmsAsync(int ownerId)
        {
            var farms = await _context.Farms
                .Include(f => f.Owner)
                .Include(f => f.Workers)
                .Where(f => f.OwnerId == ownerId && f.IsActive)
                .OrderBy(f => f.FarmName)
                .ToListAsync();

            var result = new List<FarmResponseDto>();
            foreach (var farm in farms)
                result.Add(await MapFarmToDto(farm));

            return result;
        }

        public async Task<FarmResponseDto?> GetFarmByIdAsync(
            int farmId, int ownerId)
        {
            var farm = await _context.Farms
                .Include(f => f.Owner)
                .Include(f => f.Workers)
                .FirstOrDefaultAsync(f =>
                    f.FarmId == farmId && f.OwnerId == ownerId);

            if (farm == null) return null;
            return await MapFarmToDto(farm);
        }

        public async Task<FarmResponseDto?> UpdateFarmAsync(
            int farmId, UpdateFarmDto dto, int ownerId)
        {
            var farm = await _context.Farms
                .Include(f => f.Owner)
                .Include(f => f.Workers)
                .FirstOrDefaultAsync(f =>
                    f.FarmId == farmId && f.OwnerId == ownerId);

            if (farm == null) return null;

            if (dto.FarmName != null) farm.FarmName = dto.FarmName;
            if (dto.FarmType != null) farm.FarmType = dto.FarmType;
            if (dto.Province != null) farm.Province = dto.Province;
            if (dto.GpsCoordinates != null) farm.GpsCoordinates = dto.GpsCoordinates;
            if (dto.GlnNumber != null) farm.GlnNumber = dto.GlnNumber;

            await _context.SaveChangesAsync();
            return await MapFarmToDto(farm);
        }

        public async Task<string> InviteWorkerAsync(
            int farmId, InviteWorkerDto dto, int ownerId)
        {
            // Verify farm belongs to this owner
            var farm = await _context.Farms
                .FirstOrDefaultAsync(f =>
                    f.FarmId == farmId && f.OwnerId == ownerId);

            if (farm == null)
                throw new Exception("Farm not found");

            // Check if email already has a pending invitation
            var existing = await _context.WorkerInvitations
                .FirstOrDefaultAsync(wi =>
                    wi.Email == dto.Email &&
                    wi.FarmId == farmId &&
                    wi.Status == "Pending");

            if (existing != null)
                throw new Exception("An invitation is already pending for this email");

            // Generate unique invitation token
            var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("/", "_")
                .Replace("+", "-")
                .Replace("=", "");

            var invitation = new WorkerInvitation
            {
                FarmId = farmId,
                InvitedByUserId = ownerId,
                Email = dto.Email,
                Role = dto.Role,
                CustomTitle = dto.CustomTitle,
                Token = token,
                Status = "Pending",
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };

            _context.WorkerInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            // Build invitation link — points to the frontend accept page
            var frontendBaseUrl = _config["AppSettings:FrontendBaseUrl"]
                ?? "http://localhost:5173";
            var invitationLink =
                $"{frontendBaseUrl}/accept?token={token}";

            // In production this sends an actual email
            // For now we return the link so you can test it
            return invitationLink;
        }

        public async Task<List<FarmWorkerResponseDto>> GetFarmWorkersAsync(
            int farmId, int ownerId)
        {
            // Verify ownership
            var farm = await _context.Farms
                .FirstOrDefaultAsync(f =>
                    f.FarmId == farmId && f.OwnerId == ownerId);

            if (farm == null) return new List<FarmWorkerResponseDto>();

            var workers = await _context.FarmWorkers
                .Include(fw => fw.User)
                .Where(fw => fw.FarmId == farmId)
                .OrderBy(fw => fw.CustomTitle)
                .ToListAsync();

            return workers.Select(fw => new FarmWorkerResponseDto
            {
                FarmWorkerId = fw.FarmWorkerId,
                UserId = fw.UserId,
                FullName = fw.User.FullName,
                Email = fw.User.Email,
                Role = fw.Role,
                CustomTitle = fw.CustomTitle,
                Status = fw.Status,
                AssignedAt = fw.AssignedAt
            }).ToList();
        }

        public async Task<FarmWorkerResponseDto?> UpdateWorkerAsync(
            int farmId, int userId, UpdateWorkerDto dto, int ownerId)
        {
            // Verify ownership
            var farm = await _context.Farms
                .FirstOrDefaultAsync(f =>
                    f.FarmId == farmId && f.OwnerId == ownerId);

            if (farm == null) return null;

            var worker = await _context.FarmWorkers
                .Include(fw => fw.User)
                .FirstOrDefaultAsync(fw =>
                    fw.FarmId == farmId && fw.UserId == userId);

            if (worker == null) return null;

            if (dto.Role != null) worker.Role = dto.Role;
            if (dto.CustomTitle != null) worker.CustomTitle = dto.CustomTitle;
            if (dto.Status != null) worker.Status = dto.Status;

            // Also update the user's system role in JWT
            if (dto.Role != null)
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == userId);
                if (user != null) user.Role = dto.Role;
            }

            await _context.SaveChangesAsync();

            return new FarmWorkerResponseDto
            {
                FarmWorkerId = worker.FarmWorkerId,
                UserId = worker.UserId,
                FullName = worker.User.FullName,
                Email = worker.User.Email,
                Role = worker.Role,
                CustomTitle = worker.CustomTitle,
                Status = worker.Status,
                AssignedAt = worker.AssignedAt
            };
        }

        public async Task<bool> RemoveWorkerAsync(
            int farmId, int userId, int ownerId)
        {
            var farm = await _context.Farms
                .FirstOrDefaultAsync(f =>
                    f.FarmId == farmId && f.OwnerId == ownerId);

            if (farm == null) return false;

            var worker = await _context.FarmWorkers
                .FirstOrDefaultAsync(fw =>
                    fw.FarmId == farmId && fw.UserId == userId);

            if (worker == null) return false;

            _context.FarmWorkers.Remove(worker);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<InvitationResponseDto?> ValidateInvitationAsync(
            string token)
        {
            var invitation = await _context.WorkerInvitations
                .Include(wi => wi.Farm)
                .Include(wi => wi.InvitedBy)
                .FirstOrDefaultAsync(wi => wi.Token == token);

            if (invitation == null) return null;

            return new InvitationResponseDto
            {
                InvitationId = invitation.InvitationId,
                Email = invitation.Email,
                FarmName = invitation.Farm.FarmName,
                Role = invitation.Role,
                CustomTitle = invitation.CustomTitle,
                InvitedByName = invitation.InvitedBy.FullName,
                ExpiresAt = invitation.ExpiresAt,
                IsValid = invitation.Status == "Pending" &&
                                invitation.ExpiresAt > DateTime.UtcNow
            };
        }

        public async Task<AuthResponseDto?> AcceptInvitationAsync(
            AcceptInvitationDto dto)
        {
            var invitation = await _context.WorkerInvitations
                .Include(wi => wi.Farm)
                .FirstOrDefaultAsync(wi =>
                    wi.Token == dto.Token &&
                    wi.Status == "Pending" &&
                    wi.ExpiresAt > DateTime.UtcNow);

            if (invitation == null)
                throw new Exception(
                    "Invitation is invalid or has expired");

            // Check if user already exists with this email
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == invitation.Email);

            User user;

            if (existingUser != null)
            {
                // User already exists — just add them to the farm
                user = existingUser;
            }
            else
            {
                // Create new user account for the worker
                user = new User
                {
                    FullName = dto.FullName,
                    Email = invitation.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    Role = invitation.Role,
                    SavcNumber = dto.SavcNumber,
                    IsVerified = invitation.Role != "Vet",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            // Assign worker to the farm
            var farmWorker = new FarmWorker
            {
                FarmId = invitation.FarmId,
                UserId = user.UserId,
                Role = invitation.Role,
                CustomTitle = invitation.CustomTitle,
                Status = "Active",
                AssignedAt = DateTime.UtcNow
            };

            _context.FarmWorkers.Add(farmWorker);

            // Mark invitation as accepted
            invitation.Status = "Accepted";

            await _context.SaveChangesAsync();

            // Log the worker in by returning a token
            return await _authService.LoginAsync(new LoginDto
            {
                Email = invitation.Email,
                Password = dto.Password
            });
        }

        private async Task<FarmResponseDto> MapFarmToDto(Farm farm)
        {
            // Load owner if not already loaded
            if (farm.Owner == null)
                await _context.Entry(farm).Reference(f => f.Owner).LoadAsync();

            // Load workers if not already loaded
            if (farm.Workers == null)
                await _context.Entry(farm).Collection(f => f.Workers).LoadAsync();

            return new FarmResponseDto
            {
                FarmId = farm.FarmId,
                FarmName = farm.FarmName,
                FarmType = farm.FarmType,
                Province = farm.Province,
                GpsCoordinates = farm.GpsCoordinates,
                GlnNumber = farm.GlnNumber,
                OwnerName = farm.Owner?.FullName ?? "Unknown",
                WorkerCount = farm.Workers?.Count ?? 0,
                IsActive = farm.IsActive,
                CreatedAt = farm.CreatedAt
            };
        }
    }
}