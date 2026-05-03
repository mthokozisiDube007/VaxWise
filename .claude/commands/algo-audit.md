# VaxWise Algorithm Audit

Audit the three algorithm engines in `VaxWise.API/Algorithms/` and the services that use them.

## Steps

1. Read all three algorithm files:
   - `VaxWise.API/Algorithms/ComplianceScoreCalculator.cs`
   - `VaxWise.API/Algorithms/OutbreakDetectionEngine.cs`
   - `VaxWise.API/Algorithms/RiskScoreEngine.cs`

2. Read all services that consume these algorithms:
   - `VaxWise.API/Services/VaccinationService.cs`
   - `VaxWise.API/Services/HealthService.cs`
   - `VaxWise.API/Services/DashboardService.cs`

3. For each algorithm, report:
   - **What it does** (one sentence)
   - **Inputs / Outputs**
   - **Scoring logic** (weights, thresholds, edge cases)
   - **Weaknesses** — any hardcoded magic numbers, edge cases not handled, logic that could produce wrong results
   - **Suggested improvement** — one concrete, implementable change

4. Check that every service is calling the algorithm correctly:
   - VaccinationService: calls `ComplianceScoreCalculator.Calculate` after saving and passes the **full** event list ordered by timestamp
   - HealthService: calls `OutbreakDetectionEngine.Analyse` with records from a **48-hour** window and the **total animal count** for the farm
   - DashboardService: calls `RiskScoreEngine.Compute` with all 7 correct parameters

5. Run `dotnet build --no-restore` in `VaxWise.API/` to confirm no compile errors.

6. Produce a final **Algorithm Health Report** with three sections:
   - Compliance Score — current state + top recommendation
   - Outbreak Detection — current state + top recommendation
   - Risk Score — current state + top recommendation

Keep the report concise — one paragraph per section maximum.
