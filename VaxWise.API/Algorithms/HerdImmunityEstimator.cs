using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Algorithms
{
    public static class HerdImmunityEstimator
    {
        // DALRRD-aligned herd immunity thresholds per notifiable disease
        private static readonly Dictionary<string, int> _thresholds = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Foot-and-Mouth Disease"]               = 80,
            ["Brucellosis"]                          = 70,
            ["Anthrax"]                              = 85,
            ["Lumpy Skin Disease"]                   = 75,
            ["Bluetongue"]                           = 70,
            ["Newcastle Disease"]                    = 90,
            ["Highly Pathogenic Avian Influenza"]    = 80,
            ["African Swine Fever"]                  = 75,
            ["Pasteurellosis"]                       = 70,
        };
        private const int DefaultThreshold = 75;

        public static List<HerdImmunityResultDto> Compute(
            List<Animal> animals,
            List<VaccinationEvent> allEvents,
            List<VaccineSchedule> schedules,
            DateTime now)
        {
            var results = new List<HerdImmunityResultDto>();

            var byType = animals
                .GroupBy(a => a.AnimalTypeId)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var schedule in schedules.Where(s => s.IsNotifiable))
            {
                if (!byType.TryGetValue(schedule.AnimalTypeId, out var typeAnimals) || typeAnimals.Count == 0)
                    continue;

                var typeName = typeAnimals[0].AnimalType?.TypeName ?? "Unknown";
                var totalAnimals = typeAnimals.Count;
                var animalIds = typeAnimals.Select(a => a.AnimalId).ToHashSet();

                // An animal is protected if its latest vaccination for this vaccine has NextDueDate > now
                var protectedCount = allEvents
                    .Where(e => animalIds.Contains(e.AnimalId) && e.VaccineName == schedule.VaccineName)
                    .GroupBy(e => e.AnimalId)
                    .Count(g => g.OrderByDescending(e => e.EventTimestamp).First().NextDueDate > now);

                var coveragePct = Math.Round((double)protectedCount / totalAnimals * 100, 1);

                var threshold = _thresholds.TryGetValue(schedule.NotifiableDiseaseName ?? "", out var t)
                    ? t : DefaultThreshold;

                var isProtected = coveragePct >= threshold;
                var needed = isProtected
                    ? 0
                    : (int)Math.Ceiling(threshold / 100.0 * totalAnimals) - protectedCount;

                results.Add(new HerdImmunityResultDto
                {
                    AnimalTypeName = typeName,
                    VaccineName = schedule.VaccineName,
                    DiseaseName = schedule.NotifiableDiseaseName ?? schedule.VaccineName,
                    TotalAnimals = totalAnimals,
                    ProtectedAnimals = protectedCount,
                    CoveragePercent = coveragePct,
                    ThresholdPercent = threshold,
                    IsProtected = isProtected,
                    AnimalsNeededForThreshold = needed,
                });
            }

            return results
                .OrderBy(r => r.AnimalTypeName)
                .ThenBy(r => r.VaccineName)
                .ToList();
        }
    }
}
