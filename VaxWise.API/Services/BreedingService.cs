using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class BreedingService : IBreedingService
    {
        private readonly AppDbContext _context;

        public BreedingService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<BreedingRecordResponseDto> RecordBreedingAsync(
            CreateBreedingRecordDto dto)
        {
            // Load female animal with its type — need gestation days
            var femaleAnimal = await _context.Animals
                .Include(a => a.AnimalType)
                .FirstOrDefaultAsync(a => a.AnimalId == dto.FemaleAnimalId);

            if (femaleAnimal == null)
                throw new Exception("Female animal not found");

            var maleAnimal = await _context.Animals
                .FirstOrDefaultAsync(a => a.AnimalId == dto.MaleAnimalId);

            if (maleAnimal == null)
                throw new Exception("Male animal not found");

            // Calculate expected birth date from gestation period
            // Each animal type has its own gestation days seeded in AnimalTypes
            var gestationDays = femaleAnimal.AnimalType.GestationDays;
            var expectedBirthDate = dto.BreedingDate.AddDays(gestationDays);

            var record = new BreedingRecord
            {
                FemaleAnimalId = dto.FemaleAnimalId,
                MaleAnimalId = dto.MaleAnimalId,
                BreedingDate = dto.BreedingDate,
                ExpectedBirthDate = expectedBirthDate,
                GestationDays = gestationDays,
                Status = "Bred",
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.BreedingRecords.Add(record);
            await _context.SaveChangesAsync();

            return MapToResponseDto(record,
                femaleAnimal.EarTagNumber,
                maleAnimal.EarTagNumber,
                femaleAnimal.AnimalType.TypeName);
        }

        public async Task<List<BreedingRecordResponseDto>> GetBreedingHistoryAsync(
            int animalId)
        {
            var records = await _context.BreedingRecords
                .Include(b => b.FemaleAnimal).ThenInclude(a => a.AnimalType)
                .Include(b => b.MaleAnimal)
                .Where(b => b.FemaleAnimalId == animalId ||
                            b.MaleAnimalId == animalId)
                .OrderByDescending(b => b.BreedingDate)
                .ToListAsync();

            return records.Select(r => MapToResponseDto(
                r,
                r.FemaleAnimal.EarTagNumber,
                r.MaleAnimal.EarTagNumber,
                r.FemaleAnimal.AnimalType.TypeName)).ToList();
        }

        public async Task<List<BreedingRecordResponseDto>> GetUpcomingBirthsAsync()
        {
            // Find all breeding records where birth is due in next 14 days
            // New code — compare dates only, ignore time component
            var today = DateTime.UtcNow.Date;
            var fourteenDaysFromNow = today.AddDays(14);

            var records = await _context.BreedingRecords
                .Include(b => b.FemaleAnimal).ThenInclude(a => a.AnimalType)
                .Include(b => b.MaleAnimal)
                .Where(b =>
                    b.ExpectedBirthDate.Date <= fourteenDaysFromNow &&
                    b.ExpectedBirthDate.Date >= today &&
                    b.Status != "Delivered")
                .OrderBy(b => b.ExpectedBirthDate)
                .ToListAsync();
            return records.Select(r => MapToResponseDto(
                r,
                r.FemaleAnimal.EarTagNumber,
                r.MaleAnimal.EarTagNumber,
                r.FemaleAnimal.AnimalType.TypeName)).ToList();
        }

        public async Task<BirthOutcomeResponseDto> RecordBirthOutcomeAsync(
            int breedingRecordId, RecordBirthOutcomeDto dto)
        {
            var record = await _context.BreedingRecords
                .Include(b => b.FemaleAnimal).ThenInclude(a => a.AnimalType)
                .FirstOrDefaultAsync(b => b.BreedingRecordId == breedingRecordId);

            if (record == null)
                throw new Exception("Breeding record not found");

            // Update breeding record with birth outcome
            record.NumberOfOffspring = dto.NumberOfOffspring;
            record.BirthWeightKg = dto.BirthWeightKg;
            record.SurvivalStatus = dto.SurvivalStatus;
            record.ActualBirthDate = dto.ActualBirthDate;
            record.Status = "Delivered";

            // Automatically register each offspring as a new animal
            var offspringEarTags = new List<string>();

            for (int i = 1; i <= dto.NumberOfOffspring; i++)
            {
                var earTag = $"{record.FemaleAnimal.EarTagNumber}-OFF-{i:D2}";

                var offspring = new Animal
                {
                    EarTagNumber = earTag,
                    RfidTag = $"RFID-OFF-{record.BreedingRecordId}-{i}",
                    AnimalTypeId = record.FemaleAnimal.AnimalTypeId,
                    Breed = record.FemaleAnimal.Breed,
                    DateOfBirth = dto.ActualBirthDate,
                    Gender = "F", // default — can be updated later
                    CurrentWeightKg = dto.BirthWeightKg,
                    PurchaseDate = dto.ActualBirthDate,
                    PurchasePrice = 0,
                    Status = "Active",
                    ComplianceScore = 0,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Animals.Add(offspring);
                offspringEarTags.Add(earTag);
            }

            await _context.SaveChangesAsync();

            return new BirthOutcomeResponseDto
            {
                BreedingRecordId = record.BreedingRecordId,
                FemaleEarTag = record.FemaleAnimal.EarTagNumber,
                NumberOfOffspring = dto.NumberOfOffspring,
                BirthWeightKg = dto.BirthWeightKg,
                SurvivalStatus = dto.SurvivalStatus,
                ActualBirthDate = dto.ActualBirthDate,
                OffspringEarTags = offspringEarTags
            };
        }

        private static BreedingRecordResponseDto MapToResponseDto(
            BreedingRecord record,
            string femaleEarTag,
            string maleEarTag,
            string animalTypeName)
        {
            return new BreedingRecordResponseDto
            {
                BreedingRecordId = record.BreedingRecordId,
                FemaleEarTag = femaleEarTag,
                MaleEarTag = maleEarTag,
                AnimalTypeName = animalTypeName,
                BreedingDate = record.BreedingDate,
                ExpectedBirthDate = record.ExpectedBirthDate,
                GestationDays = record.GestationDays,
                Status = record.Status,
                Notes = record.Notes,
                CreatedAt = record.CreatedAt
            };
        }
    }
}