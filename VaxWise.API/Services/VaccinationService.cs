using Microsoft.EntityFrameworkCore;
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
            // Step 1 — Find the animal to get its RFID tag
            var animal = await _context.Animals
                .FirstOrDefaultAsync(a => a.AnimalId == dto.AnimalId && a.FarmId == farmId);


            if (animal == null)
                throw new Exception("Animal not found");

            // Step 2 — Record the exact timestamp of this event
            var timestamp = DateTime.UtcNow;

            // Step 3 — Generate the SHA-256 Audit-Lock hash
            // This is the cryptographic proof that this event happened
            // If anyone changes any of these five values — the hash breaks
            var auditHash = HashHelper.GenerateSha256(
                dto.VaccineBatch,
                dto.GpsCoordinates,
                savcNumber,
                animal.RfidTag,
                timestamp
            );

            // Step 4 — Create the vaccination event record
            var vaccinationEvent = new VaccinationEvent
            {
                AnimalId = dto.AnimalId,
                SavcNumber = savcNumber,
                VaccineBatch = dto.VaccineBatch,
                VaccineName = dto.VaccineName,
                ExpiryDate = dto.ExpiryDate,
                Manufacturer = dto.Manufacturer,
                GpsCoordinates = dto.GpsCoordinates,
                EventTimestamp = timestamp,
                AuditHash = auditHash,
                NextDueDate = dto.NextDueDate,
                CaptureMode = dto.CaptureMode,
                CreatedAt = DateTime.UtcNow
            };

            _context.VaccinationEvents.Add(vaccinationEvent);

            // Step 5 — Update the animal's compliance score
            // Every successful vaccination increases compliance score
            animal.ComplianceScore = Math.Min(animal.ComplianceScore + 20, 100);

            await _context.SaveChangesAsync();

            return MapToResponseDto(vaccinationEvent, animal.EarTagNumber);
        }

        public async Task<List<VaccinationResponseDto>> GetByAnimalIdAsync(int animalId)
        {
            var events = await _context.VaccinationEvents
                .Include(v => v.Animal)
                .Where(v => v.AnimalId == animalId)
                .OrderByDescending(v => v.EventTimestamp)
                .ToListAsync();

            return events
                .Select(v => MapToResponseDto(v, v.Animal.EarTagNumber))
                .ToList();
        }

        public async Task<List<VaccinationResponseDto>> GetUpcomingAsync()
        {
            // Find all vaccination events where NextDueDate 
            // is within the next 7 days from today
            var sevenDaysFromNow = DateTime.UtcNow.AddDays(7);

            var events = await _context.VaccinationEvents
                .Include(v => v.Animal)
                .Where(v => v.NextDueDate <= sevenDaysFromNow
                         && v.NextDueDate >= DateTime.UtcNow)
                .OrderBy(v => v.NextDueDate)
                .ToListAsync();

            return events
                .Select(v => MapToResponseDto(v, v.Animal.EarTagNumber))
                .ToList();
        }

        public async Task<List<VaccinationResponseDto>> SyncAsync(
            SyncVaccinationsDto dto, string savcNumber)
        {
            var results = new List<VaccinationResponseDto>();

            // Process events in timestamp order — oldest first
            // This is the Delta-Sync Authority Hierarchy rule
            var orderedEvents = dto.Events
                .OrderBy(e => e.CaptureMode)
                .ToList();

            foreach (var eventDto in orderedEvents)
            {
                // Capture each offline event using the same
                // CaptureAsync method — hash generated for each one
                var result = await CaptureAsync(eventDto, savcNumber);
                results.Add(result);
            }

            return results;
        }

        // Private helper — maps VaccinationEvent to response DTO
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