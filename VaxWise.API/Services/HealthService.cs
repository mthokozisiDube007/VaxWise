using Microsoft.EntityFrameworkCore;
using VaxWise.API.Algorithms;
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
                AnimalId        = dto.AnimalId,
                FarmId          = farmId,
                RecordType      = dto.RecordType,
                Symptoms        = dto.Symptoms,
                Diagnosis       = dto.Diagnosis,
                MedicationUsed  = dto.MedicationUsed,
                Dosage          = dto.Dosage,
                VetName         = dto.VetName,
                Outcome         = dto.Outcome,
                TreatmentDate   = dto.TreatmentDate,
                IsUnderTreatment = true,
                WithdrawalDays  = dto.WithdrawalDays,   // Feature 3
                CreatedAt       = DateTime.UtcNow
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
                .AsNoTracking()
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
                .AsNoTracking()
                .Include(h => h.Animal)
                .Where(h => h.FarmId == farmId && h.IsUnderTreatment)
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
                .AsNoTracking()
                .Include(h => h.Animal)
                .Where(h => h.FarmId == farmId && h.TreatmentDate >= fortyEightHoursAgo)
                .ToListAsync();

            int totalAnimals = await _context.Animals
                .CountAsync(a => a.FarmId == farmId);

            // Feature 2 — load notifiable disease keywords from schedule library
            var notifiableDiseases = await _context.VaccineSchedules
                .AsNoTracking()
                .Where(vs => vs.IsNotifiable && vs.NotifiableDiseaseName != null)
                .Select(vs => new
                {
                    vs.VaccineName,
                    DiseaseName = vs.NotifiableDiseaseName!,
                    vs.ReportingWindowHours
                })
                .Distinct()
                .ToListAsync();

            var notifiableList = notifiableDiseases
                .Select(d => (d.VaccineName, d.DiseaseName, d.ReportingWindowHours))
                .ToList<(string Keyword, string DiseaseName, int ReportingWindowHours)>();

            var records = recentRecords
                .Select(r => (r, r.Animal.EarTagNumber))
                .ToList();

            return OutbreakDetectionEngine.Analyse(symptoms, records, totalAnimals, notifiableList);
        }

        private static HealthRecordResponseDto MapToResponseDto(
            HealthRecord record, string earTagNumber)
        {
            var now = DateTime.UtcNow;
            bool withdrawalActive = WithdrawalPeriodCalculator.IsActive(
                record.TreatmentDate, record.WithdrawalDays, now);

            return new HealthRecordResponseDto
            {
                HealthRecordId       = record.HealthRecordId,
                AnimalId             = record.AnimalId,
                AnimalEarTag         = earTagNumber,
                RecordType           = record.RecordType,
                Symptoms             = record.Symptoms,
                Diagnosis            = record.Diagnosis,
                MedicationUsed       = record.MedicationUsed,
                Dosage               = record.Dosage,
                VetName              = record.VetName,
                Outcome              = record.Outcome,
                TreatmentDate        = record.TreatmentDate,
                IsUnderTreatment     = record.IsUnderTreatment,
                WithdrawalDays       = record.WithdrawalDays,
                WithdrawalClearDate  = record.WithdrawalDays > 0
                    ? WithdrawalPeriodCalculator.GetClearDate(record.TreatmentDate, record.WithdrawalDays)
                    : null,
                IsWithdrawalActive   = withdrawalActive,
                DaysUntilClear       = withdrawalActive
                    ? WithdrawalPeriodCalculator.DaysRemaining(record.TreatmentDate, record.WithdrawalDays, now)
                    : 0,
                CreatedAt            = record.CreatedAt
            };
        }
    }
}
