# Session Changes Summary

This document summarizes the features and fixes implemented during the recent development session on the Performance Appraisal application.

---

## 1. Disaster Recovery settings tab

**Problem:** Disaster Recovery was a separate route and the tab was not visible to Super Admin users.

**Changes:**
- Disaster Recovery is now a tab on the main settings page: `/settings?tab=disaster-recovery`
- New `DisasterRecoveryPanel` component embedded in settings
- Migration adds `system.disaster_recovery.manage` permission and syncs it to Super Admin
- Old DR route redirects to the settings tab
- Sidebar shows a single **Settings** entry for users with DR or general settings access

**Key files:**
- `resources/js/pages/settings/index.tsx`
- `resources/js/components/settings/disaster-recovery-panel.tsx`
- `database/migrations/2026_05_19_120000_add_disaster_recovery_permission.php`

---

## 2. Report export loading spinner

**Problem:** Comprehensive report downloads had no visible loading state after confirming the export dialog.

**Changes:**
- Report export buttons now use `ExportDownloadDialog` (spinner → success/error), matching template export behaviour

**Key files:**
- `resources/js/components/performance/ReportExportButtons.tsx`
- `resources/js/components/performance/export-download-dialog.tsx`

---

## 3. Help page process flow chart

**Changes:**
- Inline SVG process flow chart on the Help page
- Download buttons for the chart (with export dialog)
- `HelpController::preview()` for full HTML preview page

**Key files:**
- `resources/js/pages/access/help/Index.tsx`
- `resources/js/components/help/system-process-flow-chart.tsx`
- `app/Http/Controllers/Access/HelpController.php`

---

## 4. Employee performance trend demo data

**Purpose:** Seed three employees with three cycles of finalized scores for trend/peer demos.

**Seeder:** `EmployeePerformanceTrendSeeder`

| Employee | Email | Trend (2024 → 2025 → 2026) |
| --- | --- | --- |
| Tatenda Dube | `tatenda.dube@nhaka.test` | 68 → 74 → 83 (Improving) |
| Rumbidzai Ncube | `rumbidzai.ncube@nhaka.test` | 86 → 79 → 72 (Declining) |
| Farai Muchengeti | `farai.muchengeti@nhaka.test` | 76 → 76 → 76 (Stable) |

Peer employees in FY2026: Chiedza Nyoni (78), Tinashe Bhebhe (81).

**Run seeder:**
```bash
php artisan db:seed --class=EmployeePerformanceTrendSeeder
```

**Credentials:** See `docs/employee-performance-trend-demo-credentials.md` (password: `password`).

**Key files:**
- `database/seeders/EmployeePerformanceTrendSeeder.php`
- `app/Services/Performance/EmployeePerformanceAnalyticsService.php`

---

## 5. Score Summary in appraisal PDF/Excel exports

**Problem:** Exports did not show the scorecard / score summary with percentage formatting (e.g. `86%`).

**Changes:**
- New `ScoreFormatter` helper formats scores as percentages and builds score summary data
- Excel export adds a **Score Summary** section after employee details
- PDF assessment form includes a **Score Summary** stat band
- Print/final PDF path (`AppraisalPdfService`) now passes the same score summary data

**Key files:**
- `app/Support/Performance/ScoreFormatter.php`
- `app/Services/Performance/Export/AppraisalExportService.php`
- `app/Services/Performance/Pdf/AppraisalPdfService.php`
- `resources/views/pdf/performance/appraisal-assessment-form.blade.php`

---

## 6. Employee profile — performance by cycle chart

**Problem:** The trend chart only appeared with 2+ finalized cycles and was buried inside appraisal history.

**Changes:**
- Dedicated **Performance by cycle** card at the top of the employee profile main column
- Bar chart for one or more scored cycles; trend line when 2+ cycles exist
- Trend badge, delta metrics, and peer comparison when data allows
- Falls back to appraisal history scores when trend API data is unavailable

**Key files:**
- `resources/js/pages/performance/employees/Show.tsx`
- `app/Http/Controllers/Performance/EmployeeProfileController.php`

---

## 7. Employee performance trend PDF export

**Changes:**
- **Export PDF** button on the profile **Cycle scores** card
- Branded PDF with employee details, summary stats, SVG bar/line chart, cycle scores table, and peer comparison
- Routes:
  - Admin: `GET /performance/employees/{id}/export/performance-trend/pdf`
  - Own profile: `GET /performance/profile/export/performance-trend/pdf`

**Key files:**
- `app/Services/Performance/Pdf/EmployeePerformanceTrendPdfService.php`
- `app/Support/Performance/PerformanceTrendChartSvg.php`
- `resources/views/pdf/performance/employee-performance-trend.blade.php`

---

## 8. Issue detail page revamp

**Changes:**
- Editorial hero header with reference, type icon, status badges, and timestamps
- **Resolution pipeline** visual (Pending → In Progress → Completed)
- Redesigned description panel and vertical **Activity timeline**
- Sidebar with people cards, assign/status forms (shadcn Select), and ticket metadata

**Key files:**
- `resources/js/pages/issues/Show.tsx`

---

## 9. Appraisal assignment email notifications

**Problem:** Assignment only sent in-app (database) notifications, not email.

**Changes:**
- `AppraisalAssignedNotification` now sends **database + email** when mail is enabled in Settings
- Email subject example: `Appraisal assigned — 2026 Annual Review`
- Assignment email only fires for **new** appraisals (not when re-assigning an existing cycle record)
- Uses `PerformanceNotificationChannels` helper to respect `mail_notifications_enabled` and SMTP config

**Key files:**
- `app/Notifications/Performance/AppraisalAssignedNotification.php`
- `app/Support/Notifications/PerformanceNotificationChannels.php`
- `app/Services/Performance/ReviewCycleAssignmentService.php`

---

## 10. Cycle milestone & deadline reminder notifications

**Purpose:** Email and in-app reminders when review cycle milestones (from **Milestones & Deadlines** on the cycle) are approaching.

**Reminder schedule:** **7, 3, and 1 days** before each deadline, for **open** cycles only.

| Milestone | Cycle field | Recipient |
| --- | --- | --- |
| Goal setting | `goal_setting_deadline` | Employee |
| Self-assessment | `self_assessment_deadline` | Employee |
| Manager review | `manager_review_deadline` | Line manager |
| Approval | `approval_deadline` | Approving manager |

**Duplicate prevention:** Sent reminders are logged in `appraisal_milestone_reminders` (one send per appraisal, milestone, and lead time).

**Scheduled command:**
```bash
php artisan performance:send-milestone-reminders
```
Runs daily at **08:00** via Laravel scheduler.

**Key files:**
- `app/Services/Performance/CycleMilestoneReminderService.php`
- `app/Notifications/Performance/CycleMilestoneReminderNotification.php`
- `app/Models/AppraisalMilestoneReminder.php`
- `database/migrations/2026_05_27_140000_create_appraisal_milestone_reminders_table.php`
- `routes/console.php`

---

## Email setup requirements

For assignment and milestone emails to send:

1. Open **Settings → Email**
2. Enable **Mail notifications enabled**
3. Configure **SMTP host** (and related fields)
4. Keep a queue worker running (notifications are queued):
   ```bash
   php artisan queue:work --tries=3 --timeout=90
   ```
5. Ensure the scheduler runs in production (`schedule:run` every minute)

---

## Migrations to run

If not already applied:

```bash
php artisan migrate
```

Notable new migrations:
- `2026_05_19_120000_add_disaster_recovery_permission.php`
- `2026_05_27_140000_create_appraisal_milestone_reminders_table.php`

---

## Tests added/updated

| Test file | Covers |
| --- | --- |
| `tests/Feature/DisasterRecovery/DisasterRecoveryTest.php` | DR settings tab |
| `tests/Feature/Access/HelpDocumentationTest.php` | Help flow chart |
| `tests/Feature/Performance/EmployeePerformanceTrendSeederTest.php` | Trend seeder |
| `tests/Feature/Performance/AppraisalAssessmentExportTest.php` | Score Summary in exports |
| `tests/Feature/Performance/EmployeePerformanceTrendExportTest.php` | Profile trend PDF |
| `tests/Feature/Performance/AppraisalWorkflowNotificationTest.php` | Assignment + milestone emails |
| `tests/Feature/Issues/IssueReportTest.php` | Issue workflows (unchanged behaviour) |

**Run notification tests:**
```bash
php artisan test tests/Feature/Performance/AppraisalWorkflowNotificationTest.php
```

---

## Quick reference — useful commands

```bash
# Seed performance trend demo data
php artisan db:seed --class=EmployeePerformanceTrendSeeder

# Send milestone reminders manually
php artisan performance:send-milestone-reminders

# Process queued notifications
php artisan queue:work --tries=3 --timeout=90
```
