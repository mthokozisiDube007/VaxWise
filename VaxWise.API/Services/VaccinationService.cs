using Microsoft.EntityFrameworkCore;
using VaxWise.API.Algorithms;
using VaxWise.API.Data;
using VaxWise.API.DTOs;
using VaxWise.API.Helpers;
using VaxWise.API.Models;

namespace VaxWise.API.Services
{
    public class VaccinationService : IVaccinationService
    {
        private readonly AppDbContext _context;

        public VaccinationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<VaccinationResponseDto> CaptureAsync(
            CreateVaccinationDto dto, string savcNumber, int farmId)
        {
            var animal = await _context.Animals
                .FirstOrDefaultAsync(a => a.AnimalId == dto.AnimalId && a.FarmId == farmId);

            if (animal == null)
                throw new Exception("Animal not found");

            var timestamp = DateTime.UtcNow;

            var auditHash = HashHelper.GenerateSha256(
                dto.VaccineBatch,
                dto.GpsCoordinates,
                savcNumber,
                animal.RfidTag,
                timestamp
            );

            // Feature 1 — auto-calculate NextDueDate from schedule library if not supplied
            DateTime nextDueDate = dto.NextDueDate ?? await ResolveNextDueDateAsync(
                dto.VaccineName, animal.AnimalTypeId, timestamp);

            var vaccinationEvent = new VaccinationEvent
            {
                AnimalId = dto.AnimalId,
                FarmId = farmId,
                SavcNumber = savcNumber,
                VaccineBatch = dto.VaccineBatch,
                VaccineName = dto.VaccineName,
                ExpiryDate = dto.ExpiryDate,
                Manufacturer = dto.Manufacturer,
                GpsCoordinates = dto.GpsCoordinates,
                EventTimestamp = timestamp,
                AuditHash = auditHash,
                NextDueDate = nextDueDate,
                CaptureMode = dto.CaptureMode,
                CreatedAt = DateTime.UtcNow
            };

            _context.VaccinationEvents.Add(vaccinationEvent);
            await _context.SaveChangesAsync();

            // Recalculate compliance score from full vaccination history
            var allEvents = await _context.VaccinationEvents
                .Where(v => v.AnimalId == dto.AnimalId && v.FarmId == farmId)
                .OrderBy(v => v.EventTimestamp)
                .ToListAsync();

            animal.ComplianceScore = ComplianceScoreCalculator.Calculate(
                allEvents, animal.Status, DateTime.UtcNow);

            await _context.SaveChangesAsync();

            return MapToResponseDto(vaccinationEvent, animal.EarTagNumber);
        }

        public async Task<List<VaccinationResponseDto>> GetByAnimalIdAsync(int animalId, int farmId)
        {
            var events = await _context.VaccinationEvents
                .Include(v => v.Animal)
                .Where(v => v.AnimalId == animalId && v.FarmId == farmId)
                .OrderByDescending(v => v.EventTimestamp)
                .ToListAsync();

            return events
                .Select(v => MapToResponseDto(v, v.Animal.EarTagNumber))
                .ToList();
        }

        public async Task<List<VaccinationResponseDto>> GetUpcomingAsync(int farmId)
        {
            var sevenDaysFromNow = DateTime.UtcNow.AddDays(7);

            var events = await _context.VaccinationEvents
                .Include(v => v.Animal)
                .Where(v =>
                    v.FarmId == farmId &&
                    v.NextDueDate <= sevenDaysFromNow &&
                    v.NextDueDate >= DateTime.UtcNow)
                .OrderBy(v => v.NextDueDate)
                .ToListAsync();

            return events
                .Select(v => MapToResponseDto(v, v.Animal.EarTagNumber))
                .ToList();
        }

        public async Task<List<VaccinationResponseDto>> SyncAsync(
            SyncVaccinationsDto dto, string savcNumber, int farmId)
        {
            var results = new List<VaccinationResponseDto>();

            foreach (var eventDto in dto.Events)
            {
                var result = await CaptureAsync(eventDto, savcNumber, farmId);
                results.Add(result);
            }

            return results;
        }

        private async Task<DateTime> ResolveNextDueDateAsync(
            string vaccineName, int animalTypeId, DateTime eventTimestamp)
        {
            var schedule = await _context.VaccineSchedules
                .FirstOrDefaultAsync(vs =>
                    vs.VaccineName == vaccineName &&
                    vs.AnimalTypeId == animalTypeId);

            return schedule != null
                ? eventTimestamp.AddDays(schedule.IntervalDays)
                : eventTimestamp.AddDays(180); // safe default: 6 months
        }

        private static VaccinationResponseDto MapToResponseDto(
            VaccinationEvent v, string earTagNumber)
        {
            return new VaccinationResponseDto
            {
                EventId = v.EventId,
                AnimalId = v.AnimalId,
                AnimalEarTag = earTagNumber,
                VaccineName = v.VaccineName,
                VaccineBatch = v.VaccineBatch,
                GpsCoordinates = v.GpsCoordinates,
                EventTimestamp = v.EventTimestamp,
                AuditHash = v.AuditHash,
                NextDueDate = v.NextDueDate,
                CaptureMode = v.CaptureMode,
                CreatedAt = v.CreatedAt
            };
        }
    }
}
