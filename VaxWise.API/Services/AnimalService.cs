using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class AnimalService : IAnimalService
    {
        private readonly AppDbContext _context;

        public AnimalService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AnimalResponseDto> CreateAsync(CreateAnimalDto dto, int farmId)
        {
            var animal = new Animal
            {
                EarTagNumber = dto.EarTagNumber,
                RfidTag = dto.RfidTag,
                AnimalTypeId = dto.AnimalTypeId,
                Breed = dto.Breed,
                DateOfBirth = dto.DateOfBirth,
                Gender = dto.Gender,
                CurrentWeightKg = dto.CurrentWeightKg,
                PurchaseDate = dto.PurchaseDate,
                PurchasePrice = dto.PurchasePrice,
                FarmId = farmId,
                Status = "Active",
                ComplianceScore = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Animals.Add(animal);
            await _context.SaveChangesAsync();

            // Reload with AnimalType included so mapping doesn't need lazy loading
            var created = await _context.Animals
                .AsNoTracking()
                .Include(a => a.AnimalType)
                .FirstAsync(a => a.AnimalId == animal.AnimalId);

            return MapToResponseDto(created);
        }

        public async Task<List<AnimalResponseDto>> GetAllAsync(int farmId)
        {
            var animals = await _context.Animals
                .AsNoTracking()
                .Include(a => a.AnimalType)
                .Where(a => a.FarmId == farmId)
                .ToListAsync();

            return animals.Select(MapToResponseDto).ToList();
        }

        public async Task<AnimalResponseDto?> GetByIdAsync(int id, int farmId)
        {
            var animal = await _context.Animals
                .AsNoTracking()
                .Include(a => a.AnimalType)
                .FirstOrDefaultAsync(a => a.AnimalId == id && a.FarmId == farmId);

            return animal == null ? null : MapToResponseDto(animal);
        }

        public async Task<AnimalResponseDto?> UpdateAsync(int id, UpdateAnimalDto dto, int farmId)
        {
            var animal = await _context.Animals
                .Include(a => a.AnimalType)
                .FirstOrDefaultAsync(a => a.AnimalId == id && a.FarmId == farmId);

            if (animal == null) return null;

            if (dto.Breed != null) animal.Breed = dto.Breed;
            if (dto.CurrentWeightKg != null) animal.CurrentWeightKg = dto.CurrentWeightKg.Value;
            if (dto.PurchasePrice != null) animal.PurchasePrice = dto.PurchasePrice.Value;
            if (dto.Status != null) animal.Status = dto.Status;

            await _context.SaveChangesAsync();
            return MapToResponseDto(animal);
        }

        public async Task<bool> DeleteAsync(int id, int farmId)
        {
            var animal = await _context.Animals
                .FirstOrDefaultAsync(a => a.AnimalId == id && a.FarmId == farmId);

            if (animal == null) return false;

            _context.Animals.Remove(animal);
            await _context.SaveChangesAsync();
            return true;
        }

        // AnimalType must be eagerly loaded by all callers via .Include(a => a.AnimalType)
        private static AnimalResponseDto MapToResponseDto(Animal animal) => new()
        {
            AnimalId = animal.AnimalId,
            EarTagNumber = animal.EarTagNumber,
            RfidTag = animal.RfidTag,
            AnimalTypeName = animal.AnimalType?.TypeName ?? "Unknown",
            Breed = animal.Breed,
            DateOfBirth = animal.DateOfBirth,
            Gender = animal.Gender,
            CurrentWeightKg = animal.CurrentWeightKg,
            PurchaseDate = animal.PurchaseDate,
            PurchasePrice = animal.PurchasePrice,
            Status = animal.Status,
            ComplianceScore = animal.ComplianceScore,
            CreatedAt = animal.CreatedAt
        };
    }
}
