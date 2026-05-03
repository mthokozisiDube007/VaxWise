using Microsoft.EntityFrameworkCore;
using VaxWise.API.Data;
using VaxWise.API.DTOs;

namespace VaxWise.API.Services
{
    public class VaccineScheduleService : IVaccineScheduleService
    {
        private readonly AppDbContext _context;

        public VaccineScheduleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<VaccineScheduleDto>> GetByAnimalTypeAsync(int animalTypeId)
        {
            return await _context.VaccineSchedules
                .Where(vs => vs.AnimalTypeId == animalTypeId)
                .OrderBy(vs => vs.VaccineName)
                .Select(vs => new VaccineScheduleDto
                {
                    VaccineScheduleId    = vs.VaccineScheduleId,
                    VaccineName          = vs.VaccineName,
                    IntervalDays         = vs.IntervalDays,
                    IsNotifiable         = vs.IsNotifiable,
                    NotifiableDiseaseName = vs.NotifiableDiseaseName,
                    ReportingWindowHours = vs.ReportingWindowHours
                })
                .ToListAsync();
        }

        public async Task<VaccineScheduleDto?> GetByVaccineNameAsync(
            string vaccineName, int animalTypeId)
        {
            var schedule = await _context.VaccineSchedules
                .FirstOrDefaultAsync(vs =>
                    vs.VaccineName == vaccineName &&
                    vs.AnimalTypeId == animalTypeId);

            if (schedule == null) return null;

            return new VaccineScheduleDto
            {
                VaccineScheduleId    = schedule.VaccineScheduleId,
                VaccineName          = schedule.VaccineName,
                IntervalDays         = schedule.IntervalDays,
                IsNotifiable         = schedule.IsNotifiable,
                NotifiableDiseaseName = schedule.NotifiableDiseaseName,
                ReportingWindowHours = schedule.ReportingWindowHours
            };
        }
    }
}
