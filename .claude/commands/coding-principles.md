# VaxWise Coding Principles

Apply these six engineering principles to every piece of code written in this project.
These are non-negotiable standards — not optional guidelines.

---

## 1. Modularity
Each class, service, or component does ONE thing and can be changed independently.

**Backend rules:**
- Each service file owns exactly one domain (Animals, Health, Vaccinations, Certificates, etc.)
- Algorithm classes live in `VaxWise.API/Algorithms/` and have zero database dependencies
- Helper utilities live in `VaxWise.API/Helpers/` and have zero service dependencies
- Controllers never contain business logic — they only call service methods and return HTTP responses

**Frontend rules:**
- API calls live in `vaxwise-client/src/api/` — never inside components or pages
- Each page file is one domain — no page imports from another page
- The axios interceptor in `axiosConfig.js` is the only place that attaches the JWT and `X-Farm-Id` header

**Violation example to reject:**
```csharp
// BAD — controller contains business logic
public async Task<IActionResult> RecordTreatment([FromBody] CreateHealthRecordDto dto)
{
    var animal = await _context.Animals.FindAsync(dto.AnimalId); // DB access in controller
    animal.Status = "UnderTreatment";
    await _context.SaveChangesAsync();
    return Ok();
}
```

---

## 2. Cohesion
Everything inside a class belongs together and serves the same purpose.

**Rules:**
- `AuthService` only handles authentication and password reset — nothing else
- `DashboardService` only assembles the dashboard DTO — it never writes to the database
- `ComplianceScoreCalculator` only computes scores — it never reads from the database
- DTOs only carry data — no methods, no logic, no database references
- If a method does not use `this` (no instance fields), make it `static`

**Check before writing a class:** Can you describe it in one sentence without using the word "and"?
If not, split it.

---

## 3. Coupling
Classes communicate through interfaces, not concrete implementations.

**Rules:**
- Every service MUST have a matching interface (`IAnimalService`, `IDashboardService`, etc.)
- Controllers depend on interfaces only — never on concrete service classes
- Algorithm classes (`ComplianceScoreCalculator`, `OutbreakDetectionEngine`, `RiskScoreEngine`)
  accept plain data parameters — never `AppDbContext` or any service
- `AppDbContext` is only injected into service classes — never into algorithm or helper classes
- New dependencies are registered in `Program.cs` via `AddScoped<IService, Service>()`

**Violation example to reject:**
```csharp
// BAD — controller depends on concrete class, not interface
public AnimalsController(AnimalService animalService) { ... }

// GOOD
public AnimalsController(IAnimalService animalService) { ... }
```

---

## 4. Immutability
Data that should not change after creation must be protected.

**Rules:**
- DTOs used as API responses use `init;` setters — they are set once and never mutated:
  ```csharp
  public class AnimalResponseDto
  {
      public int AnimalId { get; init; }
      public string EarTagNumber { get; init; } = string.Empty;
  }
  ```
- Vaccination audit hashes (`AuditHash`) are never updated after creation — if you see
  code that modifies `AuditHash` after the record is saved, reject it
- Algorithm inputs must be `IReadOnlyList<T>` — never `List<T>` — so callers cannot
  accidentally mutate the list inside the algorithm
- Local variables that are set once use `var` + assignment — never reassigned later
- `foreach` is preferred over `for` loops with index when the index is not needed

---

## 5. Idempotency
Calling the same operation multiple times produces the same result as calling it once.

**Rules:**
- `POST /api/auth/forgot-password` called twice for the same email replaces the previous
  token — never creates duplicate rows. The service must `UPDATE`, not `INSERT`.
- `POST /api/auth/reset-password` with an already-used token returns a safe error —
  it never resets the password a second time (token is cleared after first use)
- `POST /api/vaccinations/sync` (bulk sync) must be safe to replay — if the same
  vaccination event is submitted twice, it should not create a duplicate record
- Database `SaveChangesAsync()` is called once at the end of an operation —
  never call it multiple times in a loop
- EF migrations are always additive — never drop and recreate columns that have data

**Check:** If a user submits the same form twice (double-click, network retry), does the
system end up in the correct state?

---

## 6. Defensive Programming
Assume inputs are wrong until proven otherwise. Fail early, fail clearly.

**Rules:**

**At API boundaries (controllers and DTOs):**
- All request DTOs use `[Required]` on mandatory fields
- Numeric IDs validated as positive: `[Range(1, int.MaxValue)]`
- String fields that must not be empty use `[MinLength(1)]`
- Email fields use `[EmailAddress]`
- Controllers return `400 Bad Request` for invalid input before calling any service

**Inside services:**
- Every service method that takes an `id` must verify the record exists AND belongs to
  the current `farmId` before operating on it
- Never assume `Include()` loaded the navigation property — check for null before access:
  ```csharp
  var earTag = animal.AnimalType?.TypeName ?? "Unknown";
  ```
- DateTime comparisons always use `DateTime.UtcNow` — never `DateTime.Now`
- Passwords are always hashed with BCrypt before storage — never stored as plain text
- Reset tokens are stored as SHA-256 hashes — the raw token is never persisted

**In algorithms:**
- `ComplianceScoreCalculator.Calculate`: if `events` is empty, return `0` immediately
- `OutbreakDetectionEngine.Analyse`: if `totalAnimalsOnFarm` is 0, return a safe
  no-outbreak result to avoid division-by-zero
- `RiskScoreEngine.Compute`: if `totalAnimals` is 0, return `(0, "Low")` immediately
- All algorithm outputs are clamped: `Math.Clamp(score, 0, 100)`

**Frontend defensive rules:**
- API calls are always wrapped in try/catch or handled via TanStack Query `onError`
- Never access `response.data.x` without checking `response.data` exists first
- The `ProtectedRoute` component guards every route except `/login`
- `localStorage` values are always read with a null-check before use

---

## How to apply these principles when writing new code

Before writing any method, ask these six questions:

| # | Question | Principle |
|---|---|---|
| 1 | Does this class/component do only one thing? | Modularity |
| 2 | Does everything in this class belong together? | Cohesion |
| 3 | Am I depending on an interface, not a concrete class? | Coupling |
| 4 | Is data that should not change protected with `init` or `IReadOnlyList`? | Immutability |
| 5 | Is it safe to call this method twice? | Idempotency |
| 6 | What happens if the input is null, empty, or out of range? | Defensive Programming |

If any answer is "no" or "I don't know", fix it before writing the next line.
