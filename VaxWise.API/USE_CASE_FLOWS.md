# VaxWise — Use Case Flows (Backend Reference)

Maps every user journey to the exact API endpoint, request shape, response shape, and business rules the frontend must honour.

---

## Table of Contents

1. [Auth Flows](#1-auth-flows)
2. [Farm Management Flows](#2-farm-management-flows)
3. [Worker Invitation Flow](#3-worker-invitation-flow)
4. [Animal Management Flows](#4-animal-management-flows)
5. [Vaccination Flows](#5-vaccination-flows)
6. [Certificate Flows](#6-certificate-flows)
7. [Health & Treatment Flows](#7-health--treatment-flows)
8. [Dashboard Flow](#8-dashboard-flow)
9. [DALRRD Report Flow](#9-dalrrd-report-flow)
10. [Admin Login Monitor Flow](#10-admin-login-monitor-flow)
11. [Farm Context Rules](#11-farm-context-rules)
12. [Role Permission Matrix](#12-role-permission-matrix)
13. [Common Error Shapes](#13-common-error-shapes)

---

## 1. Auth Flows

### 1.1 Register (FarmOwner or Admin only)

Only `FarmOwner` and `Admin` can self-register. Every other role is created via invitation.

**Endpoint:** `POST /api/auth/register`  
**Auth required:** No

```json
// Request
{
  "fullName": "Sipho Dlamini",
  "email": "sipho@farm.co.za",
  "password": "SecurePass123!",
  "role": "FarmOwner",       // FarmOwner | Admin only
  "savcNumber": null         // only required when role = "Vet"
}

// Response 200
{
  "token": "<JWT>",
  "fullName": "Sipho Dlamini",
  "email": "sipho@farm.co.za",
  "role": "FarmOwner",
  "expiresAt": "2026-06-03T12:00:00Z"
}
```

**Frontend rules:**
- Show `SavcNumber` field only when `role === "Vet"` (registration via invite only, but the field exists).
- Store the JWT in `localStorage` / auth context immediately after success.
- Redirect to `/farms` — new FarmOwners have no farms yet.

---

### 1.2 Login

**Endpoint:** `POST /api/auth/login`  
**Auth required:** No  
**Rate limited:** Yes (`"login"` policy)

```json
// Request
{
  "email": "sipho@farm.co.za",
  "password": "SecurePass123!"
}

// Response 200
{
  "token": "<JWT>",
  "fullName": "Sipho Dlamini",
  "email": "sipho@farm.co.za",
  "role": "FarmOwner",
  "expiresAt": "2026-06-03T12:00:00Z"
}

// Response 401 — wrong credentials
{ "message": "Invalid credentials" }
```

**Frontend rules:**
- Every login attempt is audit-logged server-side (non-blocking).
- On success decode the JWT to extract `role` and `name` claims for the sidebar.
- On 401 show an inline error — do not navigate away.

---

### 1.3 Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`  
**Auth required:** No

```json
// Request
{ "email": "sipho@farm.co.za" }

// Response 200 (always, even if email not found — security)
{ "message": "If this email exists a reset link has been sent." }
```

---

### 1.4 Reset Password

**Endpoint:** `POST /api/auth/reset-password`  
**Auth required:** No  
**Token TTL:** 15 minutes

```json
// Request
{
  "token": "<reset-token-from-email>",
  "newPassword": "NewSecure456!"
}

// Response 200
{ "message": "Password reset successfully." }

// Response 400 — expired or invalid token
{ "message": "Token is invalid or expired." }
```

---

## 2. Farm Management Flows

> All farm endpoints require JWT + `FarmOwner` role.

### 2.1 Create Farm

**Endpoint:** `POST /api/farms`

```json
// Request
{
  "farmName": "Sunridge Cattle Farm",
  "farmType": "Livestock",      // Livestock | Crops | Mixed
  "province": "Gauteng",
  "gpsCoordinates": "-26.2023,28.0293",   // optional
  "glnNumber": "6001234000000"            // optional, DALRRD compliance
}

// Response 200
{
  "farmId": 7,
  "farmName": "Sunridge Cattle Farm",
  "farmType": "Livestock",
  "province": "Gauteng",
  "gpsCoordinates": "-26.2023,28.0293",
  "glnNumber": "6001234000000",
  "ownerName": "Sipho Dlamini",
  "workerCount": 0,
  "isActive": true,
  "createdAt": "2026-05-03T10:00:00Z"
}
```

**Frontend rules:**
- After success, call `invalidateQueries(['farms'])` to refresh the sidebar farm selector.
- Automatically set the new farm as `activeFarmId` so the user isn't stuck on the "Select a Farm" gate.

---

### 2.2 List My Farms

**Endpoint:** `GET /api/farms`

```json
// Response 200 — array of FarmResponseDto
[
  {
    "farmId": 7,
    "farmName": "Sunridge Cattle Farm",
    "farmType": "Livestock",
    "province": "Gauteng",
    "workerCount": 3,
    "isActive": true,
    "createdAt": "2026-05-03T10:00:00Z"
  }
]
```

---

### 2.3 Update Farm

**Endpoint:** `PUT /api/farms/{farmId}`

```json
// Request — all fields optional, only send what changed
{
  "farmName": "Sunridge Premium Cattle",
  "glnNumber": "6001234000001"
}

// Response 200 — full FarmResponseDto
```

---

## 3. Worker Invitation Flow

Full lifecycle: FarmOwner invites → worker receives link → worker accepts → worker appears in farm roster.

### Step 1 — FarmOwner sends invitation

**Endpoint:** `POST /api/farms/{farmId}/invite`  
**Role required:** `FarmOwner`

```json
// Request
{
  "email": "thabo@worker.co.za",
  "role": "Worker",            // Manager | Worker | Vet
  "customTitle": "Head Herdsman"
}

// Response 200
{
  "message": "Invitation sent to thabo@worker.co.za",
  "invitationLink": "https://vaxwise.co.za/accept?token=abc123xyz",
  "note": "In production this link is sent via email. For testing use this link directly."
}
```

**Frontend rules:**
- Display the `invitationLink` so the owner can copy-paste it during testing.
- In production this link is emailed automatically.
- Invitations expire after **7 days**.

---

### Step 2 — Worker validates token (before showing registration form)

**Endpoint:** `GET /api/invitations/{token}`  
**Auth required:** No

```json
// Response 200 — token is valid
{
  "invitationId": 12,
  "email": "thabo@worker.co.za",
  "farmName": "Sunridge Cattle Farm",
  "role": "Worker",
  "customTitle": "Head Herdsman",
  "invitedByName": "Sipho Dlamini",
  "expiresAt": "2026-05-10T10:00:00Z",
  "isValid": true
}

// Response 400 — expired or already accepted
{ "message": "Invitation is invalid or has expired." }
```

**Frontend rules:**
- Always call this first when the user lands on `/accept?token=...`.
- Pre-fill `email` from the response (read-only).
- Show `SavcNumber` field only when `role === "Vet"`.

---

### Step 3 — Worker accepts and creates account

**Endpoint:** `POST /api/invitations/accept`  
**Auth required:** No

```json
// Request
{
  "token": "abc123xyz",
  "fullName": "Thabo Mokoena",
  "password": "WorkerPass789!",
  "savcNumber": null           // only for Vet role
}

// Response 200 — returns JWT immediately (auto-login)
{
  "token": "<JWT>",
  "fullName": "Thabo Mokoena",
  "email": "thabo@worker.co.za",
  "role": "Worker",
  "expiresAt": "2026-06-03T12:00:00Z"
}
```

**Frontend rules:**
- After success, store the token and navigate to `/` (dashboard).
- If email already existed in the system, the user is added to the farm without creating a new account.

---

### 3.1 List Farm Workers

**Endpoint:** `GET /api/farms/{farmId}/workers`  
**Role required:** `FarmOwner`

```json
// Response 200
[
  {
    "farmWorkerId": 5,
    "userId": 22,
    "fullName": "Thabo Mokoena",
    "email": "thabo@worker.co.za",
    "role": "Worker",
    "customTitle": "Head Herdsman",
    "status": "Active",          // Active | Suspended | Pending
    "assignedAt": "2026-05-03T11:00:00Z"
  }
]
```

---

### 3.2 Update Worker

**Endpoint:** `PUT /api/farms/{farmId}/workers/{userId}`

```json
// Request — all optional
{
  "role": "FarmManager",
  "customTitle": "Senior Manager",
  "status": "Active"
}
```

---

### 3.3 Remove Worker

**Endpoint:** `DELETE /api/farms/{farmId}/workers/{userId}`

```json
// Response 200
{ "message": "Worker removed from farm" }
```

---

## 4. Animal Management Flows

> All animal endpoints require the `X-Farm-Id` header (see §11).

### 4.1 Create Animal

**Endpoint:** `POST /api/animals`  
**Roles:** `FarmOwner`, `FarmManager`

```json
// Request
{
  "earTagNumber": "ZA-GT-00123",    // physical ear tag (max 20 chars)
  "rfidTag": "900123456789012",     // electronic RFID (max 30 chars)
  "animalTypeId": 1,                // FK → AnimalType
  "breed": "Nguni",
  "dateOfBirth": "2023-01-15",
  "gender": "M",                    // M | F
  "currentWeightKg": 320.5,
  "purchaseDate": "2023-06-01",
  "purchasePrice": 8500.00
}

// Response 200 — AnimalResponseDto
{
  "animalId": 45,
  "earTagNumber": "ZA-GT-00123",
  "rfidTag": "900123456789012",
  "animalTypeName": "Cattle",
  "breed": "Nguni",
  "dateOfBirth": "2023-01-15T00:00:00Z",
  "gender": "M",
  "currentWeightKg": 320.5,
  "purchaseDate": "2023-06-01T00:00:00Z",
  "purchasePrice": 8500.00,
  "status": "Active",
  "complianceScore": 0,
  "createdAt": "2026-05-03T10:00:00Z"
}
```

---

### 4.2 List Animals

**Endpoint:** `GET /api/animals`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — array of AnimalResponseDto
// complianceScore 0-100 (recalculated after each vaccination)
```

---

### 4.3 Update Animal

**Endpoint:** `PUT /api/animals/{id}`  
**Roles:** `FarmOwner`, `FarmManager`

```json
// Request — all optional
{
  "breed": "Bonsmara",
  "currentWeightKg": 380.0,
  "status": "UnderTreatment"    // Active | Sold | Deceased | Quarantined | UnderTreatment
}
```

---

### 4.4 Delete Animal

**Endpoint:** `DELETE /api/animals/{id}`  
**Role:** `Admin` only

---

## 5. Vaccination Flows

### 5.1 Record Single Vaccination

**Endpoint:** `POST /api/vaccinations/capture`  
**Role:** `Vet`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Request
{
  "animalId": 45,
  "vaccineBatch": "BATCH-2026-001",
  "vaccineName": "Lumpy Skin Disease Vaccine",
  "expiryDate": "2027-01-01",
  "manufacturer": "Onderstepoort Biologicals",
  "gpsCoordinates": "-26.2023,28.0293",
  "nextDueDate": null,          // omit → auto-calculated from VaccineSchedule
  "captureMode": "Online"       // Online | Offline
}

// Response 200 — VaccinationResponseDto
{
  "eventId": 201,
  "animalId": 45,
  "animalEarTag": "ZA-GT-00123",
  "vaccineName": "Lumpy Skin Disease Vaccine",
  "vaccineBatch": "BATCH-2026-001",
  "gpsCoordinates": "-26.2023,28.0293",
  "eventTimestamp": "2026-05-03T10:00:00Z",
  "auditHash": "a3f9d1...",     // SHA-256 (batch + gps + savc + rfid + timestamp)
  "nextDueDate": "2026-11-03T10:00:00Z",
  "captureMode": "Online",
  "createdAt": "2026-05-03T10:00:00Z"
}
```

**Frontend rules:**
- `nextDueDate` is auto-calculated if omitted — always show the calculated value to the user after success.
- `auditHash` must be displayed and can be used to generate a certificate.
- `complianceScore` on the animal is updated server-side after capture.

---

### 5.2 Get Vaccine Schedule Library

**Endpoint:** `GET /api/vaccineschedules?animalTypeId={id}`  
**Auth required:** Yes

```json
// Response 200
[
  {
    "vaccineScheduleId": 3,
    "vaccineName": "Lumpy Skin Disease Vaccine",
    "intervalDays": 180,
    "isNotifiable": true,
    "notifiableDiseaseName": "Lumpy Skin Disease",
    "reportingWindowHours": 24
  }
]
```

**Frontend rules:**
- Populate the `vaccineName` dropdown from this endpoint.
- If `isNotifiable === true`, show a warning: "This is a notifiable disease — a DALRRD report will be triggered if an outbreak is detected."

---

### 5.3 Get Upcoming Vaccinations

**Endpoint:** `GET /api/vaccinations/upcoming`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — animals with NextDueDate within next 7 days
[
  {
    "eventId": 195,
    "animalEarTag": "ZA-GT-00120",
    "vaccineName": "FMD Vaccine",
    "nextDueDate": "2026-05-06T10:00:00Z"
  }
]
```

---

### 5.4 Get Vaccination History for Animal

**Endpoint:** `GET /api/vaccinations/animal/{animalId}`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — full VaccinationResponseDto array, newest first
```

---

### 5.5 Offline Sync (Batch Upload)

**Endpoint:** `POST /api/vaccinations/sync`  
**Role:** `Vet`

```json
// Request
{
  "events": [
    {
      "animalId": 45,
      "vaccineBatch": "BATCH-2026-001",
      "vaccineName": "Lumpy Skin Disease Vaccine",
      "expiryDate": "2027-01-01",
      "manufacturer": "Onderstepoort Biologicals",
      "gpsCoordinates": "-26.2023,28.0293",
      "captureMode": "Offline"
    }
  ]
}

// Response 200
{ "synced": 1, "failed": 0 }
```

---

## 6. Certificate Flows

### 6.1 Generate Certificate

**Endpoint:** `POST /api/certificates/generate/{eventId}`  
**Role:** `Vet`

```json
// Response 200 — CertificateResponseDto
{
  "certId": 88,
  "eventId": 201,
  "animalEarTag": "ZA-GT-00123",
  "vaccineName": "Lumpy Skin Disease Vaccine",
  "auditHash": "a3f9d1...",
  "qrCodeUrl": "https://vaxwise.co.za/verify/88",
  "issuedAt": "2026-05-03T10:00:00Z",
  "expiresAt": "2026-06-02T10:00:00Z",   // always 30 days
  "status": "Valid",
  "pdfBase64": "JVBERi0xLjQ..."           // Base64-encoded PDF
}
```

**Frontend rules:**
- Decode `pdfBase64` to offer a "Download PDF" button: `URL.createObjectURL(new Blob([atob(pdfBase64)], { type: 'application/pdf' }))`.
- Display `qrCodeUrl` as a QR code image for scanning.
- Certificates expire in **30 days** — show remaining days.

---

### 6.2 List Farm Certificates

**Endpoint:** `GET /api/certificates/farm`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — array of CertificateResponseDto
// status: Valid | Expired | Tampered
```

---

### 6.3 Public Verification (no auth)

**Endpoint:** `GET /api/certificates/verify/{certId}`  
**Auth required:** No — this is the QR code scan target

```json
// Response 200
{
  "certId": 88,
  "animalEarTag": "ZA-GT-00123",
  "farmerName": "Sipho Dlamini",
  "vaccineName": "Lumpy Skin Disease Vaccine",
  "vaccineBatch": "BATCH-2026-001",
  "savcNumber": "SAVC-001234",
  "gpsCoordinates": "-26.2023,28.0293",
  "eventTimestamp": "2026-05-03T10:00:00Z",
  "auditHash": "a3f9d1...",
  "expiresAt": "2026-06-02T10:00:00Z",
  "verificationStatus": "Valid"   // Valid | Expired | Tampered
}
```

**Frontend rules:**
- This page needs no login — render a public verification card.
- Color the status badge: `Valid` = green, `Expired` = grey, `Tampered` = red.

---

## 7. Health & Treatment Flows

### 7.1 Record Health Treatment

**Endpoint:** `POST /api/health/treatment`  
**Role:** `Vet`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Request
{
  "animalId": 45,
  "recordType": "Treatment",      // Treatment | VetVisit | Observation
  "symptoms": "Fever, nasal discharge",
  "diagnosis": "Bovine Respiratory Disease",
  "medicationUsed": "Oxytetracycline",
  "dosage": "5ml/kg",
  "vetName": "Dr. Nkosi",
  "outcome": "Improving",
  "treatmentDate": "2026-05-03T08:00:00Z",
  "withdrawalDays": 14            // 0-365, blocks sale/slaughter
}

// Response 200 — HealthRecordResponseDto
{
  "healthRecordId": 33,
  "animalId": 45,
  "animalEarTag": "ZA-GT-00123",
  "recordType": "Treatment",
  "symptoms": "Fever, nasal discharge",
  "diagnosis": "Bovine Respiratory Disease",
  "medicationUsed": "Oxytetracycline",
  "dosage": "5ml/kg",
  "vetName": "Dr. Nkosi",
  "outcome": "Improving",
  "treatmentDate": "2026-05-03T08:00:00Z",
  "isUnderTreatment": true,
  "withdrawalDays": 14,
  "withdrawalClearDate": "2026-05-17T08:00:00Z",
  "isWithdrawalActive": true,
  "daysUntilClear": 14,
  "createdAt": "2026-05-03T10:00:00Z"
}
```

**Frontend rules:**
- Show `withdrawalClearDate` prominently — this animal cannot be sold/slaughtered until this date.
- Update `animal.status` to `"UnderTreatment"` locally after success (or refetch animals).
- If `isWithdrawalActive === true` on any animal, surface a warning on the Animals page.

---

### 7.2 Get Health History for Animal

**Endpoint:** `GET /api/health/animal/{animalId}`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — array of HealthRecordResponseDto, newest first
```

---

### 7.3 Get All Animals Currently Under Treatment

**Endpoint:** `GET /api/health/current`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — array of HealthRecordResponseDto where isUnderTreatment = true
```

---

### 7.4 Check for Outbreak

**Endpoint:** `GET /api/health/outbreak?symptoms={urlEncodedSymptoms}`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200
{
  "outbreakDetected": true,
  "riskLevel": "High",           // None | Low | Medium | High | Critical
  "symptoms": "Fever, nasal discharge",
  "affectedAnimalsCount": 4,
  "affectedEarTags": ["ZA-GT-00120", "ZA-GT-00121", "ZA-GT-00122", "ZA-GT-00123"],
  "alertMessage": "OUTBREAK ALERT: 4 animals show similar symptoms within 48 hours.",
  "detectedAt": "2026-05-03T10:00:00Z",
  "isNotifiable": true,
  "notifiableDiseaseName": "Bovine Respiratory Disease",
  "dalrrdReportDeadline": "2026-05-04T10:00:00Z"   // 24 hours from detection
}
```

**Frontend rules:**
- Outbreak is triggered server-side when **3 or more** animals share symptoms within **48 hours**.
- If `isNotifiable === true`, show the DALRRD alert banner and the report deadline.
- `dalrrdReportDeadline` is 24 hours after detection — show a countdown.
- If `outbreakDetected === false`, show a green "No outbreak detected" status.

---

## 8. Dashboard Flow

### 8.1 Get Farm Dashboard

**Endpoint:** `GET /api/dashboard`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — DashboardDto
{
  // Animal summary
  "totalAnimals": 120,
  "activeAnimals": 115,
  "animalsUnderTreatment": 3,
  "quarantinedAnimals": 2,
  "averageComplianceScore": 84,

  // Vaccination alerts
  "upcomingVaccinationsCount": 8,
  "upcomingVaccinationEarTags": ["ZA-GT-00105", "ZA-GT-00106"],

  // Health alerts
  "animalsCurrentlyUnderTreatment": 3,
  "activeOutbreakDetected": false,
  "notifiableDiseaseDetected": false,
  "notifiableDiseaseName": null,
  "dalrrdReportDeadline": null,
  "animalsUnderWithdrawal": 2,

  // Vaccination coverage
  "overdueVaccinationsCount": 5,
  "neverVaccinatedCount": 10,
  "vaccinationCoverageRate": 91.7,     // percentage

  // Biosecurity risk
  "farmRiskScore": 28,                 // 0-100
  "farmRiskLevel": "Low",              // Low | Medium | High | Critical

  // Totals
  "totalCertificatesIssued": 340,
  "totalVaccinationEvents": 512,
  "generatedAt": "2026-05-03T10:00:00Z"
}
```

**Frontend rules:**
- Poll or stale after **2 minutes** (`staleTime: 2 * 60 * 1000`) — this is already set in main.jsx defaults.
- If `activeOutbreakDetected === true`, show a full-width DALRRD alert banner at the top of the dashboard.
- `farmRiskScore` drives the risk gauge — color: <40 green, <70 amber, ≥70 red.
- `vaccinationCoverageRate` drives the coverage progress bar.
- `upcomingVaccinationEarTags` — link each tag to the animal's vaccination history.

---

## 9. DALRRD Report Flow

### 9.1 Generate Compliance Report

**Endpoint:** `GET /api/reports/dalrrd`  
**Header:** `X-Farm-Id: {farmId}`

```json
// Response 200 — only if notifiable disease detected in last 48 hours
{
  "reportNumber": "VW-0007-202605031000",
  "pdfBase64": "JVBERi0xLjQ...",
  "generatedAt": "2026-05-03T10:00:00Z"
}

// Response 404 — no active notifiable disease outbreak
{ "message": "No notifiable disease outbreak detected in the last 48 hours." }
```

**Frontend rules:**
- Show the "Export DALRRD Report" button **only** when `dashboard.notifiableDiseaseDetected === true`.
- On 404 response, show: "No active outbreak to report."
- Decode `pdfBase64` and trigger a file download named `VW-{farmId}-DALRRD-Report.pdf`.

---

## 10. Admin Login Monitor Flow

### 10.1 Get Login Statistics

**Endpoint:** `GET /api/admin/login-stats`  
**Role:** `Admin` only  
**Auto-refreshes:** every 30 s (`refetchInterval: 30_000`)

```json
// Response 200 — LoginStatsDto
{
  "totalLogins24h": 47,
  "successfulLogins24h": 44,
  "failedLogins24h": 3,
  "successRate24h": 93.6,
  "avgResponseTimeMs24h": 87.4,
  "peakResponseTimeMs24h": 312,

  "totalLogins7d": 280,
  "successfulLogins7d": 271,
  "failedLogins7d": 9,
  "successRate7d": 96.8,
  "avgResponseTimeMs7d": 91.2,
  "uniqueUsers7d": 14,

  "hourlyBreakdown24h": [
    { "hour": 0, "total": 0, "successful": 0, "failed": 0 },
    { "hour": 1, "total": 2, "successful": 2, "failed": 0 }
    // ... all 24 hours always present
  ],

  "recentLogs": [
    {
      "logId": 441,
      "email": "sipho@farm.co.za",
      "success": true,
      "ipAddress": "41.13.0.1",
      "userAgent": "Mozilla/5.0 ...",
      "responseTimeMs": 92,
      "failureReason": null,
      "role": "FarmOwner",
      "attemptedAt": "2026-05-03T09:55:00Z"
    }
  ]
}
```

**Response time colour thresholds:**
| Range | Colour | Label |
|-------|--------|-------|
| ≤ 100 ms | `#22C55E` green | Fast |
| 101–300 ms | `#F59E0B` amber | Acceptable |
| > 300 ms | `#EF4444` red | Slow |

---

## 11. Farm Context Rules

Every request that operates on farm data **must** include one of:

| Method | Header | Effect |
|--------|--------|--------|
| `X-Farm-Id: {farmId}` | HTTP header | Explicitly selects that farm |
| *(omitted)* | — | Server resolves to user's first/only farm |

**Server resolution order:**
1. `X-Farm-Id` header (highest priority)
2. User's first farm (if they own only one)
3. Returns first farm if multiple (user must switch via header)

**Frontend implementation:**
```js
// axiosConfig.js — attach active farm on every request
axios.interceptors.request.use(config => {
  const farmId = getActiveFarmId();       // from AuthContext
  if (farmId) config.headers['X-Farm-Id'] = farmId;
  return config;
});
```

**Layout gate** — pages that do NOT need farm context (bypass the "Select a Farm" screen):
- `/farms` — create your first farm
- `/settings` — user preferences
- `/admin` — admin-only, cross-farm

---

## 12. Role Permission Matrix

| Endpoint / Action | Admin | FarmOwner | FarmManager | Vet | Worker |
|---|:---:|:---:|:---:|:---:|:---:|
| Register (self) | ✓ | ✓ | — | — | — |
| Login | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create / list farms | ✓ | ✓ | — | — | — |
| Invite / manage workers | ✓ | ✓ | — | — | — |
| Create animal | ✓ | ✓ | ✓ | — | — |
| Update animal | ✓ | ✓ | ✓ | — | — |
| Delete animal | ✓ | — | — | — | — |
| View animals | ✓ | ✓ | ✓ | ✓ | ✓ |
| Capture vaccination | — | — | — | ✓ | — |
| View vaccinations | ✓ | ✓ | ✓ | ✓ | ✓ |
| Record health treatment | — | — | — | ✓ | — |
| View health records | ✓ | ✓ | ✓ | ✓ | ✓ |
| Generate certificate | — | — | — | ✓ | — |
| View certificates | ✓ | ✓ | ✓ | ✓ | ✓ |
| Verify certificate (public) | ✓ | ✓ | ✓ | ✓ | ✓ |
| View dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export DALRRD report | ✓ | ✓ | ✓ | ✓ | — |
| Admin login monitor | ✓ | — | — | — | — |

---

## 13. Common Error Shapes

```json
// 400 Bad Request — validation failure
{
  "errors": {
    "EarTagNumber": ["The field EarTagNumber must be a string with maximum length 20."],
    "Gender": ["The field Gender must be 'M' or 'F'."]
  }
}

// 401 Unauthorized — missing or expired JWT
{ "message": "Unauthorized" }

// 403 Forbidden — wrong role
{ "message": "Forbidden" }

// 404 Not Found
{ "message": "Farm not found" }

// 429 Too Many Requests — rate limit hit
{ "message": "Too many requests. Please try again in 60 seconds." }
```

**Frontend handling pattern:**
```js
try {
  const data = await api.post('/vaccinations/capture', payload);
  // success path
} catch (err) {
  if (err.response?.status === 400) {
    // show field-level errors from err.response.data.errors
  } else if (err.response?.status === 401) {
    logout(); navigate('/login');
  } else if (err.response?.status === 403) {
    // show "You do not have permission to perform this action"
  } else if (err.response?.status === 429) {
    // show rate limit message with retry countdown
  } else {
    // generic "Something went wrong. Please try again."
  }
}
```

---

*Generated from VaxWise.API source — update this file whenever controllers, DTOs, or business rules change.*
