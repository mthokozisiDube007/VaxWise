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

        public async Task<AnimalResponseDto> CreateAsync(
         CreateAnimalDto dto, int farmId)
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
                FarmId = farmId,  // ← stamp FarmId on creation
                Status = "Active",
                ComplianceScore = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.Animals.Add(animal);
            await _context.SaveChangesAsync();
            return await MapToResponseDto(animal);
        }

        public async Task<List<AnimalResponseDto>> GetAllAsync(int farmId)
        {
            var animals = await _context.Animals
                .Include(a => a.AnimalType)
                .Where(a => a.FarmId == farmId)  // ← filter by farm
                .ToListAsync();

            return animals
                .Select(a => MapToResponseDto(a).Result)
                .ToList();
        }

        public async Task<AnimalResponseDto?> GetByIdAsync(int id, int farmId)
        {
            var animal = await _context.Animals
                .Include(a => a.AnimalType)
                .FirstOrDefaultAsync(a =>
                    a.AnimalId == id &&
                    a.FarmId == farmId);  // ← ensure animal belongs to this farm

            if (animal == null) return null;
            return await MapToResponseDto(animal);
        }

        public async Task<AnimalResponseDto?> UpdateAsync(
            int id, UpdateAnimalDto dto, int farmId)
        {
            var animal = await _context.Animals
                .Include(a => a.AnimalType)
                .FirstOrDefaultAsync(a =>
                    a.AnimalId == id &&
                    a.FarmId == farmId);  // ← security check

            if (animal == null) return null;

            if (dto.Breed != null) animal.Breed = dto.Breed;
            if (dto.CurrentWeightKg != null) animal.CurrentWeightKg = dto.CurrentWeightKg.Value;
            if (dto.PurchasePrice != null) animal.PurchasePrice = dto.PurchasePrice.Value;
            if (dto.Status != null) animal.Status = dto.Status;

            await _context.SaveChangesAsync();
            return await MapToResponseDto(animal);
        }

        public async Task<bool> DeleteAsync(int id, int farmId)
        {
            var animal = await _context.Animals
                .FirstOrDefaultAsync(a =>
                    a.AnimalId == id &&
                    a.FarmId == farmId);  // ← security check

            if (animal == null) return false;

            _context.Animals.Remove(animal);
            await _context.SaveChangesAsync();
            return true;
        }


        // Private helper — maps Animal model to AnimalResponseDto
        // Private because only AnimalService needs this — Encapsulation
        private async Task<AnimalResponseDto> MapToResponseDto(Animal animal)
        {
            // Load AnimalType if not already loaded
            if (animal.AnimalType == null)
            {
                await _context.Entry(animal)
                    .Reference(a => a.AnimalType)
                    .LoadAsync();
            }

            return new AnimalResponseDto
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
}