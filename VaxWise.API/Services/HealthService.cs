using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class HealthService : IHealthService
    {
        private readonly AppDbContext _context;

        public HealthService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<HealthRecordResponseDto> RecordTreatmentAsync(
            CreateHealthRecordDto dto, int farmId)
        {
            var animal = await _context.Animals
                .FirstOrDefaultAsync(a => a.AnimalId == dto.AnimalId && a.FarmId == farmId);

            if (animal == null)
                throw new Exception("Animal not found");

            var record = new HealthRecord
            {
                AnimalId = dto.AnimalId,
                FarmId = farmId,
                RecordType = dto.RecordType,
                Symptoms = dto.Symptoms,
                Diagnosis = dto.Diagnosis,
                MedicationUsed = dto.MedicationUsed,
                Dosage = dto.Dosage,
                VetName = dto.VetName,
                Outcome = dto.Outcome,
                TreatmentDate = dto.TreatmentDate,
                IsUnderTreatment = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.HealthRecords.Add(record);

            animal.Status = "UnderTreatment";

            await _context.SaveChangesAsync();

            await CheckOutbreaksAsync(dto.Symptoms, farmId);

            return MapToResponseDto(record, animal.EarTagNumber);
        }

        public async Task<List<HealthRecordResponseDto>> GetAllRecordsAsync(
            int animalId, int farmId)
        {
            var records = await _context.HealthRecords
                .Include(h => h.Animal)
                .Where(h => h.AnimalId == animalId && h.FarmId == farmId)
                .OrderByDescending(h => h.TreatmentDate)
                .ToListAsync();

            return records
                .Select(r => MapToResponseDto(r, r.Animal.EarTagNumber))
                .ToList();
        }

        public async Task<List<HealthRecordResponseDto>> GetAllCurrentAsync(int farmId)
        {
            var records = await _context.HealthRecords
                .Include(h => h.Animal)
                .Where(h => h.FarmId == farmId && h.IsUnderTreatment == true)
                .OrderByDescending(h => h.TreatmentDate)
                .ToListAsync();

            return records
                .Select(r => MapToResponseDto(r, r.Animal.EarTagNumber))
                .ToList();
        }

        public async Task<OutbreakAlertDto?> CheckOutbreaksAsync(string symptoms, int farmId)
        {
            var fortyEightHoursAgo = DateTime.UtcNow.AddHours(-48);

            var recentRecords = await _context.HealthRecords
                .Include(h => h.Animal)
                .Where(h =>
                    h.FarmId == farmId &&
                    h.Symptoms.Contains(symptoms) &&
                    h.TreatmentDate >= fortyEightHoursAgo)
                .ToListAsync();

            if (recentRecords.Count < 3)
                return new OutbreakAlertDto
                {
                    OutbreakDetected = false,
                    Symptoms = symptoms,
                    AffectedAnimalsCount = recentRecords.Count,
                    AffectedEarTags = new List<string>(),
                    AlertMessage = "No outbreak detected",
                    DetectedAt = DateTime.UtcNow
                };

            var affectedEarTags = recentRecords
                .Select(r => r.Animal.EarTagNumber)
                .Distinct()
                .ToList();

            return new OutbreakAlertDto
            {
                OutbreakDetected = true,
                Symptoms = symptoms,
                AffectedAnimalsCount = affectedEarTags.Count,
                AffectedEarTags = affectedEarTags,
                AlertMessage = $"OUTBREAK ALERT — {affectedEarTags.Count} animals showing '{symptoms}' within 48 hours. Immediate containment required.",
                DetectedAt = DateTime.UtcNow
            };
        }

        private static HealthRecordResponseDto MapToResponseDto(
            HealthRecord record, string earTagNumber)
        {
            return new HealthRecordResponseDto
            {
                HealthRecordId = record.HealthRecordId,
                AnimalId = record.AnimalId,
                AnimalEarTag = earTagNumber,
                RecordType = record.RecordType,
                Symptoms = record.Symptoms,
                Diagnosis = record.Diagnosis,
                MedicationUsed = record.MedicationUsed,
                Dosage = record.Dosage,
                VetName = record.VetName,
                Outcome = record.Outcome,
                TreatmentDate = record.TreatmentDate,
                IsUnderTreatment = record.IsUnderTreatment,
                CreatedAt = record.CreatedAt
            };
        }
    }
}
