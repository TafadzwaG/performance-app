# Employee Performance Trend Demo Credentials

Demo accounts seeded by `EmployeePerformanceTrendSeeder` to simulate **three review cycles** of finalized performance scores.

**Default password (all accounts below):** `password`

**Seed command:**

```bash
php artisan db:seed --class=EmployeePerformanceTrendSeeder
```

---

## Primary demo employees (3-cycle trends)

| Name | Email | Employee # | Role | 2024 | 2025 | 2026 | Trend |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| Tatenda Dube | `tatenda.dube@nhaka.test` | CX-001 | Employee | 68 | 74 | 83 | Improving |
| Rumbidzai Ncube | `rumbidzai.ncube@nhaka.test` | FIN-011 | Employee | 86 | 79 | 72 | Declining |
| Farai Muchengeti | `farai.muchengeti@nhaka.test` | DIG-014 | Employee | 76 | 76 | 76 | Stable |

### Login details

**Tatenda Dube (Improving)**
- Email: `tatenda.dube@nhaka.test`
- Password: `password`

**Rumbidzai Ncube (Declining)**
- Email: `rumbidzai.ncube@nhaka.test`
- Password: `password`

**Farai Muchengeti (Stable)**
- Email: `farai.muchengeti@nhaka.test`
- Password: `password`

---

## Peer comparison cohort (2026 cycle)

These employees are seeded in the same scorecard and review cycle so peer comparison works on Tatenda’s profile.

| Name | Email | Employee # | 2026 score |
| --- | --- | --- | ---: |
| Chiedza Nyoni | `chiedza.nyoni@nhaka.test` | CMB-006 | 78 |
| Tinashe Bhebhe | `tinashe.bhebhe@nhaka.test` | OPS-015 | 81 |

Password for both: `password`

---

## Review cycles used

| Code | Name | Status |
| --- | --- | --- |
| `FY2024-ANNUAL` | 2024 Annual Performance Review | Closed |
| `FY2025-ANNUAL` | 2025 Annual Performance Review | Closed |
| `FY2026-ANNUAL` | 2026 Annual Performance Review | Open (current) |

---

## Where to verify in the app

1. **Employee profile trend chart** — Performance → Employees → open any of the three primary employees → performance trend section (3 data points).
2. **Movement report** — Performance → Reports → Comprehensive Reports → Employee Performance Movement (filter by **2026 Annual Performance Review**).
3. **Own profile** — Log in as any demo employee to view their personal trend on My Profile.

---

## Notes

- Accounts are created or updated by the seeder; existing users with the same email are reused.
- Appraisals are stored as **finalized** with `overall_score` only (no calibrated override).
- For a full local dataset including managers and HR users, run `php artisan db:seed` (includes `PerformanceTestingSeeder` before this seeder).
