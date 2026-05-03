using VaxWise.API.DTOs;
using VaxWise.API.Models;

namespace VaxWise.API.Algorithms
{
    public static class OutbreakDetectionEngine
    {
        private static readonly HashSet<string> StopWords =
            new(StringComparer.OrdinalIgnoreCase)
            { "and", "or", "the", "a", "an", "with", "has", "have", "is", "in" };

        public static HashSet<string> Tokenise(string symptoms)
        {
            return symptoms
                .Split(new[] { ',', ';', '/', '-', ' ' },
                    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => t.ToLowerInvariant())
                .Where(t => t.Length > 2 && !StopWords.Contains(t))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Analyses recent health records for an active outbreak.
        ///
        /// Outbreak threshold = max(3, ceil(5% of farm animals)).
        ///
        /// Risk levels (% of farm affected):
        ///   None &lt; 5%  |  Low 5–10%  |  Medium 10–20%  |  High 20–30%  |  Critical &gt; 30%
        ///
        /// notifiableDiseases: list of (keyword, diseaseName, reportingWindowHours)
        /// loaded from VaccineSchedule table — passed in to keep this class DB-free.
        /// </summary>
        public static OutbreakAlertDto Analyse(
            string triggerSymptoms,
            IReadOnlyList<(HealthRecord Record, string EarTag)> recentRecords,
            int totalAnimalsOnFarm,
            IReadOnlyList<(string Keyword, string DiseaseName, int ReportingWindowHours)> notifiableDiseases)
        {
            if (totalAnimalsOnFarm == 0)
                return SafeNoOutbreak(triggerSymptoms);

            var triggerTokens = Tokenise(triggerSymptoms);

            var matches = recentRecords
                .Where(r => Tokenise(r.Record.Symptoms).Overlaps(triggerTokens))
                .ToList();

            var affectedAnimalIds = matches.Select(r => r.Record.AnimalId).Distinct().ToList();
            int affectedCount = affectedAnimalIds.Count;

            double percentage = (double)affectedCount / totalAnimalsOnFarm * 100.0;

            int threshold = Math.Max(3, (int)Math.Ceiling(totalAnimalsOnFarm * 0.05));
            bool outbreakDetected = affectedCount >= threshold;

            string riskLevel = percentage switch
            {
                >= 30 => "Critical",
                >= 20 => "High",
                >= 10 => "Medium",
                >= 5  => "Low",
                _     => "None"
            };

            // Feature 2 — check if symptoms match a notifiable disease keyword
            bool isNotifiable = false;
            string? notifiableDiseaseName = null;
            DateTime? dalrrdDeadline = null;

            foreach (var (keyword, diseaseName, reportingWindowHours) in notifiableDiseases)
            {
                if (triggerTokens.Contains(keyword, StringComparer.OrdinalIgnoreCase))
                {
                    isNotifiable = true;
                    notifiableDiseaseName = diseaseName;
                    dalrrdDeadline = DateTime.UtcNow.AddHours(reportingWindowHours);
                    break;
                }
            }

            var affectedEarTags = matches.Select(r => r.EarTag).Distinct().ToList();

            string notifiableWarning = isNotifiable
                ? $" ⚠ NOTIFIABLE DISEASE ({notifiableDiseaseName}) — Report to DALRRD by {dalrrdDeadline:yyyy-MM-dd HH:mm} UTC."
                : string.Empty;

            string message = outbreakDetected
                ? $"OUTBREAK ALERT [{riskLevel.ToUpper()}] — {affectedCount} animals " +
                  $"({percentage:F1}% of farm) showing related symptoms within 48 hours. " +
                  $"Immediate containment required.{notifiableWarning}"
                : affectedCount > 0
                    ? $"[{riskLevel}] {affectedCount} animal(s) showing related symptoms. " +
                      $"Monitor closely — threshold not yet reached.{notifiableWarning}"
                    : "No related symptoms detected. No outbreak risk.";

            return new OutbreakAlertDto
            {
                OutbreakDetected = outbreakDetected,
                RiskLevel = riskLevel,
                Symptoms = triggerSymptoms,
                AffectedAnimalsCount = affectedCount,
                AffectedEarTags = affectedEarTags,
                AlertMessage = message,
                DetectedAt = DateTime.UtcNow,
                IsNotifiable = isNotifiable,
                NotifiableDiseaseName = notifiableDiseaseName,
                DalrrdReportDeadline = dalrrdDeadline
            };
        }

        private static OutbreakAlertDto SafeNoOutbreak(string symptoms) => new()
        {
            OutbreakDetected = false,
            RiskLevel = "None",
            Symptoms = symptoms,
            AffectedAnimalsCount = 0,
            AffectedEarTags = new List<string>(),
            AlertMessage = "No outbreak risk — farm has no registered animals.",
            DetectedAt = DateTime.UtcNow
        };
    }
}
