# VaxWise Refactoring Skill

Apply safe, disciplined refactoring to any file or feature in VaxWise.
Refactoring changes structure — never behaviour. The code must work identically before and after.

---

## Cardinal Rule
**Never refactor and add features in the same commit.**
Refactor first → build passes → then add the feature.

---

## Refactoring Catalogue

### 1. Extract Method
**When:** A method is doing more than one thing, or a block of code has a comment above it explaining what it does.

**Signal:** Method longer than 20 lines, nested conditionals deeper than 2 levels, or a comment like `// calculate score`.

**Before:**
```csharp
public async Task<DashboardDto> GetDashboardAsync(int farmId)
{
    // ... 40 lines of mixed queries, calculations and DTO assembly
}
```

**After:**
```csharp
public async Task<DashboardDto> GetDashboardAsync(int farmId)
{
    var animals        = await LoadAnimalsAsync(farmId);
    var vaccinations   = await LoadUpcomingVaccinationsAsync(farmId);
    var coverage       = ComputeCoverage(animals, vaccinations);
    var risk           = ComputeRisk(animals, coverage);
    return AssembleDto(animals, vaccinations, coverage, risk);
}
```

**VaxWise targets:**
- `DashboardService.GetDashboardAsync` — extract `ComputeCoverageAsync`, `ComputeRiskAsync`, `AssembleDashboardDto`
- `CertificateService.GeneratePdf` — extract `BuildAnimalSection`, `BuildVaccinationSection`, `BuildCryptographicSection`
- `OutbreakDetectionEngine.Analyse` — extract `MatchRecordsBySymptoms`, `ComputeRiskLevel`, `BuildAlertMessage`

---

### 2. Extract Class
**When:** A class has two distinct clusters of fields and methods that do not depend on each other.

**Signal:** Class has more than 200 lines, or its name contains "And" / "Manager" / "Helper" (too vague).

**VaxWise target — split `AuthService`:**
```csharp
// Before: AuthService handles login, registration AND password reset

// After:
// AuthService.cs          — login, register, JWT generation
// PasswordResetService.cs — GeneratePasswordResetTokenAsync, ResetPasswordAsync
// IPasswordResetService.cs
```

**Steps:**
1. Identify the cluster of methods to move
2. Create the new class and interface
3. Move methods — do not change their logic
4. Register new service in `Program.cs`
5. Update the controller to inject the new interface
6. Run `dotnet build` — 0 errors before continuing

---

### 3. Rename
**When:** A name does not reveal intent, uses abbreviations, or is misleading.

**Rules:**
- Classes: `PascalCase` noun — `OutbreakDetectionEngine`, not `ODE` or `OutbreakHelper`
- Methods: `PascalCase` verb-noun — `CalculateComplianceScore`, not `Calc` or `DoScore`
- Variables: `camelCase` — `animalId`, not `id`, `a`, or `obj`
- Booleans: prefix with `is` / `has` / `can` — `isOverdue`, `hasActiveOutbreak`
- Async methods: suffix with `Async` — `GetDashboardAsync`, not `GetDashboard`
- DTOs: suffix with `Dto` — `DashboardDto`, not `DashboardData` or `DashboardModel`
- Interfaces: prefix with `I` — `IAnimalService`, not `AnimalServiceInterface`

**VaxWise rename targets:**
```csharp
// Bad names found in codebase — rename these on sight:
recentSymptoms   → activeOutbreakDetected   // bool, not a collection
r                → record                   // loop variable in LINQ
g                → symptomGroup             // GroupBy variable
v                → vaccinationEvent         // loop variable
h                → healthRecord             // loop variable
```

---

### 4. Replace Magic Number with Named Constant
**When:** A literal number or string appears in logic without explanation.

**Before:**
```csharp
user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);
score -= Math.Min(weeksOverdue * 5, 30);
var threshold = Math.Max(3, (int)Math.Ceiling(totalAnimalsOnFarm * 0.05));
```

**After:**
```csharp
// VaxWise.API/Algorithms/AlgorithmConstants.cs
public static class AlgorithmConstants
{
    public const int PasswordResetExpiryMinutes     = 15;
    public const int CompliancePointsTimely         = 20;
    public const int CompliancePointsLate           = 10;
    public const int ComplianceOverduePenaltyPerWeek = 5;
    public const int ComplianceMaxOverduePenalty    = 30;
    public const int OutbreakMinimumThreshold       = 3;
    public const double OutbreakFarmPercentThreshold = 0.05;
    public const int OutbreakWindowHours            = 48;
}
```

**VaxWise magic numbers to eliminate:**
- `AddMinutes(15)` in `AuthService` → `AlgorithmConstants.PasswordResetExpiryMinutes`
- `AddDays(7)` in `VaccinationService` → `AlgorithmConstants.UpcomingVaccinationWindowDays`
- `AddDays(30)` in `CertificateService` → `AlgorithmConstants.CertificateExpiryDays`
- `AddHours(48)` in `HealthService` → `AlgorithmConstants.OutbreakWindowHours`
- `Math.Max(3, ...)` in `OutbreakDetectionEngine` → `AlgorithmConstants.OutbreakMinimumThreshold`
- `* 0.05` in `OutbreakDetectionEngine` → `AlgorithmConstants.OutbreakFarmPercentThreshold`

---

### 5. Replace Conditional with Polymorphism
**When:** A `switch` / `if-else` chain switches on a type or category and will grow over time.

**Before:**
```csharp
// Every time a new animal type is added, this switch grows
string speciesCode = animal.AnimalType?.TypeName switch
{
    "Cattle"  => "BOV",
    "Sheep"   => "OVI",
    "Goat"    => "CAP",
    "Pig"     => "SUI",
    "Chicken" => "AVI",
    _         => "UNK"
};
```

**After — use a dictionary or lookup:**
```csharp
// VaxWise.API/Helpers/SpeciesCodeLookup.cs
public static class SpeciesCodeLookup
{
    private static readonly IReadOnlyDictionary<string, string> Codes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Cattle"]  = "BOV",
            ["Sheep"]   = "OVI",
            ["Goat"]    = "CAP",
            ["Pig"]     = "SUI",
            ["Chicken"] = "AVI"
        };

    public static string Get(string? typeName) =>
        typeName != null && Codes.TryGetValue(typeName, out var code) ? code : "UNK";
}
```

---

### 6. Introduce Parameter Object
**When:** A method takes more than 3 parameters, especially if several are always passed together.

**Before:**
```csharp
public static (int Score, string Level) Compute(
    int totalAnimals,
    int overdueVaccinations,
    int neverVaccinated,
    int underTreatment,
    int quarantined,
    bool activeOutbreak,
    int averageComplianceScore)
```

**After:**
```csharp
// VaxWise.API/Algorithms/FarmRiskInput.cs
public record FarmRiskInput(
    int TotalAnimals,
    int OverdueVaccinations,
    int NeverVaccinated,
    int UnderTreatment,
    int Quarantined,
    bool ActiveOutbreak,
    int AverageComplianceScore);

// Caller:
var input = new FarmRiskInput(
    TotalAnimals:          animals.Count,
    OverdueVaccinations:   overdueVaccinationsCount,
    NeverVaccinated:       neverVaccinatedCount,
    UnderTreatment:        underTreatmentCount,
    Quarantined:           quarantinedCount,
    ActiveOutbreak:        activeOutbreak,
    AverageComplianceScore: avgCompliance);

var (score, level) = RiskScoreEngine.Compute(input);
```

**VaxWise targets:**
- `RiskScoreEngine.Compute` — 7 parameters → `FarmRiskInput` record
- `OutbreakDetectionEngine.Analyse` — introduce `OutbreakAnalysisInput` record

---

### 7. Remove Dead Code
**When:** A method, field, or class is never called anywhere.

**Steps:**
1. Search for usages: `Grep` the class/method name across the whole project
2. If zero usages — delete it. Do not comment it out.
3. If unsure — check git log. If it was never used after being written, delete it.

**VaxWise targets to check:**
- Any unused DTOs after removing Feeding/Breeding/Financial features
- Migration snapshot: ensure `AppDbContextModelSnapshot.cs` has no `FeedRecords`, `BreedingRecords`, or `Financials` tables remaining
- `AuthDtos.cs`: confirm old unused fields are removed after password reset addition

---

### 8. Replace Exception with Validation Result
**When:** A service throws `new Exception("message")` for predictable business rule violations.

**Before:**
```csharp
if (animal == null)
    throw new Exception("Animal not found");
```

**After — use a result type:**
```csharp
// VaxWise.API/Models/ServiceResult.cs
public record ServiceResult<T>(bool Success, T? Data, string? Error)
{
    public static ServiceResult<T> Ok(T data)    => new(true, data, null);
    public static ServiceResult<T> Fail(string error) => new(false, default, error);
}

// In service:
if (animal == null)
    return ServiceResult<VaccinationResponseDto>.Fail("Animal not found");

// In controller:
var result = await _vaccinationService.CaptureAsync(dto, savcNumber, farmId);
if (!result.Success)
    return NotFound(new { message = result.Error });
return Ok(result.Data);
```

---

### 9. Encapsulate Collection
**When:** A public `List<T>` field is exposed directly, allowing callers to mutate it.

**Before:**
```csharp
public class OutbreakAlertDto
{
    public List<string> AffectedEarTags { get; set; } = new();
}
```

**After:**
```csharp
public class OutbreakAlertDto
{
    public IReadOnlyList<string> AffectedEarTags { get; init; } = Array.Empty<string>();
}
```

**VaxWise targets:**
- `OutbreakAlertDto.AffectedEarTags` → `IReadOnlyList<string>`
- `DashboardDto.UpcomingVaccinationEarTags` → `IReadOnlyList<string>`

---

### 10. Consolidate Duplicate Code (DRY)
**When:** The same logic appears in two or more places.

**VaxWise duplicate to fix — farm ownership check:**
```csharp
// This pattern appears in EVERY service method — extract it:
var animal = await _context.Animals
    .FirstOrDefaultAsync(a => a.AnimalId == id && a.FarmId == farmId);
if (animal == null) return null;

// Extract to a helper method in each service:
private async Task<Animal?> FindAnimalAsync(int animalId, int farmId) =>
    await _context.Animals
        .FirstOrDefaultAsync(a => a.AnimalId == animalId && a.FarmId == farmId);
```

---

## Refactoring Checklist — run before and after every refactor

```
Before:
[ ] Build passes: dotnet build --no-restore → 0 errors
[ ] Identified the single refactoring to apply (one at a time)
[ ] No new features added in this change

During:
[ ] Applied exactly one refactoring from the catalogue above
[ ] No logic changed — only structure
[ ] All renamed symbols updated everywhere (controllers, services, tests)

After:
[ ] Build passes: dotnet build --no-restore → 0 errors, 0 warnings
[ ] The refactored code is simpler to read than before
[ ] Named constants replace all magic numbers touched in this change
[ ] No commented-out code left behind
```

---

## Refactoring Priority Order for VaxWise

Run these in order — each one makes the next one easier:

1. **Create `AlgorithmConstants.cs`** — eliminate all magic numbers in Algorithms/ and Services/
2. **Extract `FarmRiskInput` record** — clean up `RiskScoreEngine.Compute` 7-parameter signature
3. **Extract `PasswordResetService`** — split `AuthService` which currently handles too many concerns
4. **Apply `IReadOnlyList` to DTOs** — `AffectedEarTags`, `UpcomingVaccinationEarTags`
5. **Extract private helpers in `DashboardService`** — `LoadVaccinationCoverageAsync`, `AssembleDashboardDto`
6. **Replace `throw new Exception`** with `ServiceResult<T>` in `VaccinationService` and `HealthService`
