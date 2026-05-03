using VaxWise.API.Models;

namespace VaxWise.API.Algorithms
{
    public static class ComplianceScoreCalculator
    {
        /// <summary>
        /// Recalculates an animal's compliance score (0-100) from its full vaccination history.
        /// Higher = better biosecurity standing.
        ///
        /// Scoring:
        ///   First vaccination:           +20 (base entry into programme)
        ///   Subsequent vaccination on time (within prev NextDueDate): +20
        ///   Subsequent vaccination late:  +10 (credited but penalised)
        ///   Currently overdue:            -5 per week overdue, max -30
        ///   Status = UnderTreatment:      -10
        ///   Status = Quarantined:         -20
        /// </summary>
        public static int Calculate(
            IReadOnlyList<VaccinationEvent> events,
            string animalStatus,
            DateTime now)
        {
            if (events.Count == 0) return 0;

            var sorted = events
                .OrderBy(e => e.EventTimestamp)
                .ToList();

            int score = 20; // first vaccination base

            for (int i = 1; i < sorted.Count; i++)
            {
                var prevDueDate = sorted[i - 1].NextDueDate;
                var thisTimestamp = sorted[i].EventTimestamp;
                score += thisTimestamp <= prevDueDate ? 20 : 10;
            }

            // Overdue penalty: latest NextDueDate has passed with no newer vaccination
            var latest = sorted[^1];
            if (latest.NextDueDate != default && latest.NextDueDate < now)
            {
                int weeksOverdue = (int)(now - latest.NextDueDate).TotalDays / 7;
                score -= Math.Min(weeksOverdue * 5, 30);
            }

            // Status penalties
            score -= animalStatus switch
            {
                "UnderTreatment" => 10,
                "Quarantined" => 20,
                _ => 0
            };

            return Math.Clamp(score, 0, 100);
        }
    }
}
