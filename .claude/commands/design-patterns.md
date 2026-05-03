# VaxWise Design Patterns — Gang of Four

Apply the correct Gang of Four pattern when the situation calls for it.
Never force a pattern where it does not fit — only use one when it solves a real problem in this codebase.

---

## Creational Patterns — How objects are created

### Factory Method
**Use when:** You need to create objects without specifying the exact class.

**VaxWise application — Certificate generation:**
```csharp
// VaxWise.API/Factories/CertificateFactory.cs
public abstract class CertificateDocumentFactory
{
    public abstract ICertificateDocument Create(VaccinationEvent vacEvent, Certificate cert);
}

public class PdfCertificateFactory : CertificateDocumentFactory
{
    public override ICertificateDocument Create(VaccinationEvent vacEvent, Certificate cert)
        => new PdfCertificateDocument(vacEvent, cert);
}

public class HtmlCertificateFactory : CertificateDocumentFactory
{
    public override ICertificateDocument Create(VaccinationEvent vacEvent, Certificate cert)
        => new HtmlCertificateDocument(vacEvent, cert);
}
```
**Why:** When VaxWise adds new certificate formats (HTML for email, XML for DALRRD), 
the factory subclass changes — `CertificateService` never changes.

---

### Builder
**Use when:** An object requires many optional parameters or a multi-step construction process.

**VaxWise application — Outbreak alert construction:**
```csharp
// VaxWise.API/Builders/OutbreakAlertBuilder.cs
public class OutbreakAlertBuilder
{
    private readonly OutbreakAlertDto _alert = new();

    public OutbreakAlertBuilder WithSymptoms(string symptoms)
    {
        _alert.Symptoms = symptoms;
        return this;
    }

    public OutbreakAlertBuilder WithAffectedAnimals(List<string> earTags)
    {
        _alert.AffectedEarTags = earTags;
        _alert.AffectedAnimalsCount = earTags.Count;
        return this;
    }

    public OutbreakAlertBuilder WithRiskLevel(string level)
    {
        _alert.RiskLevel = level;
        _alert.OutbreakDetected = level is "Low" or "Medium" or "High" or "Critical";
        return this;
    }

    public OutbreakAlertBuilder WithMessage(string message)
    {
        _alert.AlertMessage = message;
        return this;
    }

    public OutbreakAlertDto Build()
    {
        _alert.DetectedAt = DateTime.UtcNow;
        return _alert;
    }
}
```
**Why:** `OutbreakDetectionEngine.Analyse` constructs a complex result object —
Builder makes the construction readable and prevents partially-built objects.

---

### Singleton
**Use when:** Exactly one instance must exist for the lifetime of the application.

**VaxWise application — already handled by ASP.NET DI:**
- `AddSingleton<T>()` in `Program.cs` for any stateless, thread-safe utility
- Example: a `VaccineScheduleLibrary` that holds read-only per-vaccine schedules loaded once at startup

```csharp
// Program.cs
builder.Services.AddSingleton<IVaccineScheduleLibrary, VaccineScheduleLibrary>();
```
**Do NOT use:** Manual `static Instance` singletons — use the DI container instead.

---

## Structural Patterns — How objects are composed

### Decorator
**Use when:** You need to add behaviour to an object without modifying its class.

**VaxWise application — Logging wrapper around services:**
```csharp
// VaxWise.API/Services/LoggingVaccinationService.cs
public class LoggingVaccinationService : IVaccinationService
{
    private readonly IVaccinationService _inner;
    private readonly ILogger<LoggingVaccinationService> _logger;

    public LoggingVaccinationService(
        IVaccinationService inner,
        ILogger<LoggingVaccinationService> logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public async Task<VaccinationResponseDto> CaptureAsync(
        CreateVaccinationDto dto, string savcNumber, int farmId)
    {
        _logger.LogInformation(
            "Capturing vaccination for animal {AnimalId} on farm {FarmId}",
            dto.AnimalId, farmId);

        var result = await _inner.CaptureAsync(dto, savcNumber, farmId);

        _logger.LogInformation(
            "Vaccination captured — EventId {EventId}, AuditHash {Hash}",
            result.EventId, result.AuditHash);

        return result;
    }
    // Delegate all other methods to _inner...
}
```
**Why:** Adds audit logging to any service without touching the service's business logic.

---

### Facade
**Use when:** A subsystem is complex — expose a simple interface over it.

**VaxWise application — Dashboard is a facade:**
```csharp
// DashboardService is already a Facade pattern.
// It hides the complexity of querying Animals, VaccinationEvents,
// HealthRecords, and Certificates, running three algorithms,
// and assembling a single DashboardDto.
// Callers (DashboardController) see only one method: GetDashboardAsync(farmId)
```
**Principle:** If you find yourself calling 4+ services from a controller, 
create a Facade service that coordinates them.

---

### Adapter
**Use when:** You need to make an incompatible interface work with existing code.

**VaxWise application — DALRRD external reporting API:**
```csharp
// VaxWise.API/Adapters/DalrrdReportAdapter.cs
public interface IDalrrdReportAdapter
{
    DalrrdAnimalRecord ToExternalFormat(Animal animal, List<VaccinationEvent> events);
}

public class DalrrdReportAdapter : IDalrrdReportAdapter
{
    public DalrrdAnimalRecord ToExternalFormat(Animal animal, List<VaccinationEvent> events)
    {
        return new DalrrdAnimalRecord
        {
            NationalId = animal.RfidTag,           // DALRRD uses RfidTag as NationalId
            SpeciesCode = MapSpeciesCode(animal.AnimalType?.TypeName),
            VaccinationHistory = events.Select(e => new DalrrdVaccinationEntry
            {
                BatchNumber = e.VaccineBatch,
                AdministeredDate = e.EventTimestamp.ToString("yyyy-MM-dd"),
                VetRegistrationNumber = e.SavcNumber
            }).ToList()
        };
    }

    private static string MapSpeciesCode(string? typeName) => typeName switch
    {
        "Cattle"  => "BOV",
        "Sheep"   => "OVI",
        "Goat"    => "CAP",
        "Pig"     => "SUI",
        "Chicken" => "AVI",
        _         => "UNK"
    };
}
```
**Why:** VaxWise internal models do not match DALRRD's external format.
The Adapter translates between them without changing either model.

---

### Composite
**Use when:** Individual objects and groups of objects must be treated the same way.

**VaxWise application — Farm hierarchy (farm → herds → animals):**
```csharp
// If VaxWise adds herd grouping, use Composite so a single animal
// and a herd of animals respond to the same IVaccinationTarget interface.
public interface IVaccinationTarget
{
    IReadOnlyList<int> GetAnimalIds();
    string DisplayName { get; }
}

public class SingleAnimal : IVaccinationTarget
{
    public int AnimalId { get; init; }
    public string DisplayName => $"Animal #{AnimalId}";
    public IReadOnlyList<int> GetAnimalIds() => new[] { AnimalId };
}

public class Herd : IVaccinationTarget
{
    private readonly List<IVaccinationTarget> _members = new();
    public string DisplayName { get; init; } = string.Empty;
    public void Add(IVaccinationTarget member) => _members.Add(member);
    public IReadOnlyList<int> GetAnimalIds() =>
        _members.SelectMany(m => m.GetAnimalIds()).ToList();
}
```

---

## Behavioural Patterns — How objects communicate

### Strategy
**Use when:** You need to swap algorithms at runtime without changing the caller.

**VaxWise application — Compliance scoring strategies per animal type:**
```csharp
// VaxWise.API/Strategies/IComplianceStrategy.cs
public interface IComplianceStrategy
{
    int Calculate(IReadOnlyList<VaccinationEvent> events, string status, DateTime now);
}

public class StandardComplianceStrategy : IComplianceStrategy
{
    public int Calculate(IReadOnlyList<VaccinationEvent> events, string status, DateTime now)
        => ComplianceScoreCalculator.Calculate(events, status, now);
}

public class DalrrdComplianceStrategy : IComplianceStrategy
{
    // DALRRD requires different weighting for FMD and Brucellosis vaccines
    public int Calculate(IReadOnlyList<VaccinationEvent> events, string status, DateTime now)
    {
        var fmdEvents = events.Where(e => e.VaccineName.Contains("FMD")).ToList();
        // Custom DALRRD scoring logic here...
        return ComplianceScoreCalculator.Calculate(fmdEvents, status, now);
    }
}
```
**Why:** Different regulatory bodies (DALRRD, provincial vets) may require 
different scoring models — Strategy lets you swap them without rewriting the service.

---

### Observer
**Use when:** One event must notify multiple independent components.

**VaxWise application — Outbreak detected → notify multiple handlers:**
```csharp
// VaxWise.API/Events/OutbreakDetectedEvent.cs
public record OutbreakDetectedEvent(
    int FarmId,
    string RiskLevel,
    List<string> AffectedEarTags,
    string Symptoms,
    DateTime DetectedAt);

// Register handlers in Program.cs via MediatR or simple delegates
// Handler 1: Log to database
// Handler 2: Send push notification to farm owner
// Handler 3: File a DALRRD incident report
```
**Why:** When an outbreak is detected, multiple systems must react.
Observer decouples `HealthService` from knowing about notifications or reporting.

---

### Template Method
**Use when:** An algorithm has fixed steps but some steps vary between implementations.

**VaxWise application — Certificate generation pipeline:**
```csharp
// VaxWise.API/Services/CertificateGeneratorBase.cs
public abstract class CertificateGeneratorBase
{
    // Template method — fixed pipeline, variable steps
    public byte[] Generate(VaccinationEvent vacEvent, Certificate cert)
    {
        ValidateInputs(vacEvent, cert);        // Step 1 — fixed
        var content = BuildContent(vacEvent, cert); // Step 2 — varies
        var document = ApplyStyling(content);   // Step 3 — varies
        return ExportToBytes(document);         // Step 4 — varies
    }

    private void ValidateInputs(VaccinationEvent v, Certificate c)
    {
        if (v == null) throw new ArgumentNullException(nameof(v));
        if (c == null) throw new ArgumentNullException(nameof(c));
    }

    protected abstract object BuildContent(VaccinationEvent v, Certificate c);
    protected abstract object ApplyStyling(object content);
    protected abstract byte[] ExportToBytes(object document);
}

public class PdfCertificateGenerator : CertificateGeneratorBase
{
    protected override object BuildContent(VaccinationEvent v, Certificate c) { /* QuestPDF */ }
    protected override object ApplyStyling(object content) { /* VaxWise brand styles */ }
    protected override byte[] ExportToBytes(object document) { /* PDF bytes */ }
}
```

---

### Command
**Use when:** You need to encapsulate a request as an object (supports undo, queuing, logging).

**VaxWise application — Offline vaccination sync queue:**
```csharp
// VaxWise.API/Commands/CaptureVaccinationCommand.cs
public record CaptureVaccinationCommand(
    CreateVaccinationDto Dto,
    string SavcNumber,
    int FarmId,
    DateTime QueuedAt);

// When the device comes back online, replay the command queue:
public class VaccinationCommandProcessor
{
    private readonly IVaccinationService _service;

    public async Task ProcessAsync(IReadOnlyList<CaptureVaccinationCommand> commands)
    {
        foreach (var cmd in commands.OrderBy(c => c.QueuedAt))
            await _service.CaptureAsync(cmd.Dto, cmd.SavcNumber, cmd.FarmId);
    }
}
```
**Why:** VaxWise's `CaptureMode = "Offline"` implies events are queued and replayed.
Command pattern makes offline sync structured and auditable.

---

### Chain of Responsibility
**Use when:** A request must pass through a series of handlers, any of which can process or reject it.

**VaxWise application — Vaccination capture validation pipeline:**
```csharp
// VaxWise.API/Validation/IVaccinationValidator.cs
public interface IVaccinationValidator
{
    IVaccinationValidator SetNext(IVaccinationValidator next);
    Task<string?> ValidateAsync(CreateVaccinationDto dto, int farmId);
}

// Chain: AnimalExists → AnimalBelongsToFarm → VaccineNotExpired → SavcNumberValid
// Each validator returns null (pass) or an error message (reject)
```

---

## Pattern Selection Guide for VaxWise

| Situation | Pattern to use |
|---|---|
| Need to create different certificate formats (PDF, HTML, XML) | Factory Method |
| Building a complex DTO with many optional fields | Builder |
| Adding logging or caching to a service without touching its logic | Decorator |
| Hiding complexity of multiple service calls behind one method | Facade |
| Translating VaxWise models to DALRRD / external API format | Adapter |
| Swapping compliance scoring rules per regulatory body | Strategy |
| Notifying multiple systems when an outbreak is detected | Observer |
| Fixed pipeline with varying steps (certificate, report generation) | Template Method |
| Queuing offline vaccination events for later replay | Command |
| Multi-step input validation where any step can reject | Chain of Responsibility |
| One shared instance of a read-only reference table | Singleton (via DI) |

---

## Rules for applying patterns in this codebase

1. **Name it** — if you use a pattern, name the file/class after it:
   `PdfCertificateFactory`, `OutbreakAlertBuilder`, `LoggingVaccinationService`

2. **Interface first** — every pattern that produces an abstraction must have an interface

3. **No over-engineering** — do not add a pattern speculatively.
   Add it when a concrete second use case exists or when the code is hard to change without it

4. **Combine with the coding principles** — patterns must still respect:
   modularity, cohesion, low coupling, immutability, idempotency, and defensive programming
