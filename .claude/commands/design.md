# VaxWise Software Design Review

Perform a full software design review of the VaxWise system across all layers.

## Steps

### 1. Read the full backend structure
Read these files to understand the current design:
- All models: `VaxWise.API/Models/*.cs`
- All DTOs: `VaxWise.API/DTOs/*.cs`
- All services: `VaxWise.API/Services/*.cs`
- All controllers: `VaxWise.API/Controllers/*.cs`
- All algorithms: `VaxWise.API/Algorithms/*.cs`
- Database context: `VaxWise.API/Data/AppDbContext.cs`
- Entry point: `VaxWise.API/Program.cs`

### 2. Read the frontend structure
Read these files to understand the client design:
- Routing: `vaxwise-client/src/App.jsx`
- Navigation: `vaxwise-client/src/components/Layout.jsx`
- API layer: `vaxwise-client/src/api/*.js`
- All pages: `vaxwise-client/src/pages/*.jsx`

### 3. Evaluate each design layer and report findings

#### A. Domain Model Design
- Are models correctly normalised? (no repeated data across tables)
- Are relationships (1-to-many, many-to-many) correctly modelled in AppDbContext?
- Are any fields missing that would be needed for DALRRD / POPIA compliance?
- Are status enums stored as strings — should they be enums or lookup tables?

#### B. API Design (Controllers + DTOs)
- Do controllers follow single-responsibility — one controller per domain entity?
- Are request DTOs validating inputs with DataAnnotations (`[Required]`, `[Range]`, etc.)?
- Are response DTOs hiding internal IDs or sensitive fields that should not be exposed?
- Are HTTP methods correct — GET for reads, POST for creates, PUT/PATCH for updates, DELETE for deletes?
- Are endpoints consistent in naming — plural nouns, kebab-case?

#### C. Service Layer Design
- Does each service have a matching interface (`IServiceName`)?
- Is business logic kept out of controllers — controllers should only call service methods?
- Are services stateless — no instance-level mutable state?
- Is there any duplicate logic across services that should be extracted?

#### D. Algorithm Layer Design (VaxWise.API/Algorithms/)
- Are algorithms pure static classes with no database dependencies (correct — they should only take in-memory data)?
- Are algorithm inputs validated before use?
- Are magic numbers (thresholds, weights) documented with constants?

#### E. Frontend Design
- Is the API layer clean — one file per domain, no API calls inside components?
- Are all protected routes guarded by the `ProtectedRoute` component?
- Is the `activeFarmId` / `X-Farm-Id` header being sent on every API request via the axios interceptor?
- Is there a consistent loading/error state pattern across all pages?

#### F. Security Design
- Is JWT validation configured with all four checks (issuer, audience, lifetime, signing key)?
- Is rate limiting applied to all routes (`api` policy) and stricter limits on `/login`?
- Are all controller routes `[Authorize]`? List any that are missing it.
- Is the CORS policy restrictive (only allows the known frontend origin)?

### 4. Identify the top 5 design improvements

For each improvement, state:
- **Layer** (Model / API / Service / Algorithm / Frontend / Security)
- **Problem** — what is wrong or missing
- **Solution** — the specific change to make (file, method, or property name)
- **Priority** — High / Medium / Low

### 5. Produce the Design Report

Structure the final output as:

```
## VaxWise Design Report

### Domain Model   — [PASS / NEEDS WORK]
<one paragraph>

### API Design     — [PASS / NEEDS WORK]
<one paragraph>

### Service Layer  — [PASS / NEEDS WORK]
<one paragraph>

### Algorithm Layer — [PASS / NEEDS WORK]
<one paragraph>

### Frontend       — [PASS / NEEDS WORK]
<one paragraph>

### Security       — [PASS / NEEDS WORK]
<one paragraph>

### Top 5 Design Improvements
1. [High] Layer — Problem → Solution
2. [High] Layer — Problem → Solution
3. [Medium] Layer — Problem → Solution
4. [Medium] Layer — Problem → Solution
5. [Low]  Layer — Problem → Solution
```

Keep each paragraph to 3–4 sentences. Be direct — name specific files and line numbers where issues are found.
