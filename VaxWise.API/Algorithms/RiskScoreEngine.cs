namespace VaxWise.API.Algorithms
{
    public static class RiskScoreEngine
    {
        /// <summary>
        /// Computes a farm-level biosecurity risk score (0 = safest, 100 = critical).
        ///
        /// Weighted components:
        ///   Unvaccinated rate (overdue + never vaccinated / total):  35 %
        ///   Active disease outbreak detected:                        30 %
        ///   Animals under treatment rate:                            20 %
        ///   Inverse average compliance score:                        15 %
        ///
        /// Risk levels:
        ///   Low       0 – 19
        ///   Medium   20 – 44
        ///   High     45 – 69
        ///   Critical 70 – 100
        /// </summary>
        public static (int Score, string Level) Compute(
            int totalAnimals,
            int overdueVaccinations,
            int neverVaccinated,
            int underTreatment,
            int quarantined,
            bool activeOutbreak,
            int averageComplianceScore)
        {
            if (totalAnimals == 0) return (0, "Low");

            double risk = 0;

            // Unvaccinated / overdue rate (weight 35%)
            double unprotectedRate = (double)(overdueVaccinations + neverVaccinated) / totalAnimals;
            risk += unprotectedRate * 35;

            // Active outbreak (weight 30%) — binary
            if (activeOutbreak) risk += 30;

            // Animals under treatment rate (weight 20%)
            double treatmentRate = (double)(underTreatment + quarantined) / totalAnimals;
            risk += treatmentRate * 20;

            // Low compliance = higher risk (weight 15%)
            double complianceRisk = (100 - Math.Max(0, averageComplianceScore)) / 100.0;
            risk += complianceRisk * 15;

            int score = (int)Math.Round(Math.Clamp(risk, 0, 100));

            string level = score switch
            {
                >= 70 => "Critical",
                >= 45 => "High",
                >= 20 => "Medium",
                _     => "Low"
            };

            return (score, level);
        }
    }
}
