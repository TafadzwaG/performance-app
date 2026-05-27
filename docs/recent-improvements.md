# Recent Improvements

Summary of features and fixes implemented in the latest development session.

---

## 1. Issue edit details — authorization and modal

### Problem
- **Edit details** on an issue did not work for reporters (403 on save).
- Edit opened a separate page; users wanted an inline modal on the issue show page.

### Root cause
`IssueReportPolicy::update()` only allowed users with `issues.assign` or `issues.update_status`. Employees have `issues.create` and `issues.view_own`, but not those admin permissions.

### Changes
- **Policy:** Reporters can update their own issues while status is not `completed`. Admins with assign/status permissions can still edit any open issue.
- **Show page:** **Edit details** (header) and **Edit** (description card) open an inline dialog with type, title, and description. Saves via `PUT` with scroll preserved.
- **Form request:** `UpdateIssueReportRequest` now authorizes via the policy.
- **Shared UI:** `IssueDetailsFormFields` component reused by Show modal and Edit page.

### Key files
- `app/Policies/IssueReportPolicy.php`
- `app/Http/Requests/Issues/UpdateIssueReportRequest.php`
- `resources/js/pages/issues/Show.tsx`
- `resources/js/components/issues/issue-details-form-fields.tsx`
- `tests/Feature/Issues/IssueReportTest.php`

---

## 2. Report an issue floater for Employee role

### Problem
Employees did not see the **Report an issue** floating button.

### Root cause
The floater checked frontend permission arrays, and the Employee role in the database often did not have `issues.create` / `issues.view_own` synced after those permissions were added.

### Changes
- **`auth.canReportIssue`** added to shared Inertia props (server-side: `$user->can('issues.create')`).
- Floater uses that flag first, with existing permission/role fallbacks.
- **Migration** `2026_05_27_120000_sync_issue_permissions_to_roles.php` re-syncs all role permissions from `PerformancePermissions`, including Employee → `issues.create` + `issues.view_own`.

### Run migration (if not already applied)
```bash
php artisan migrate
```

### Key files
- `app/Http/Middleware/HandleInertiaRequests.php`
- `resources/js/components/issues/report-issue-bubble.tsx`
- `database/migrations/2026_05_27_120000_sync_issue_permissions_to_roles.php`
- `tests/Feature/Issues/IssueReportTest.php`

---

## 3. Score summary on dashboard (Goals tab)

### Problem
Employees had no quick view of their appraisal scores on the dashboard.

### Changes
- **Goals tab** shows a **Score Summary** card (Business, Values, Overall, Final Rating) using the same `ScoreSummaryCard` as appraisal pages.
- **Latest scores** appear at the top when the user has a finalized (or scored) appraisal.
- **Cycle-specific scores** appear when a review cycle is selected in the Goals tab.
- Backend exposes `myScoreSummary` and `score_summary` on goal view payloads.

### Key files
- `app/Services/Performance/DashboardGoalsViewService.php`
- `app/Http/Controllers/Performance/DashboardController.php`
- `resources/js/pages/performance/dashboard/Index.tsx`
- `resources/js/types/performance.ts`
- `tests/Feature/Performance/DashboardGoalsTabTest.php`

---

## 4. Appraisal step completion email notifications

### Requirement
When a user completes each appraisal workflow step, send email to:
1. The person who completed the step (confirmation).
2. The person responsible for the **next** stage (line manager, approving manager, calibrators, or HR finalizers as appropriate).

### Notification matrix

| Step completed | Confirmation to | Next-stage notification to |
| --- | --- | --- |
| Appraisal assigned | Employee | — (employee starts goal planning) |
| Goal plan submitted | Employee | — (employee continues to self assessment) |
| Self assessment submitted | Employee | Line manager |
| Manager review forwarded | Line manager | Approving manager |
| Approval (→ calibration) | Approving manager | Calibration committee |
| Calibration completed | Calibrator | HR users with finalize permission + employee/manager/approver (calibration completed notice) |
| Finalization | HR finalizer | Employee, line manager, approving manager |
| Send back | Person who sent back | Employee or manager/approver (based on reopened stage) |

### Technical changes
- **`AppraisalWorkflowNotificationService`** — central routing for who gets notified at each workflow event.
- **`AppraisalStepCompletedNotification`** — confirmation to the actor who completed a step.
- **`AppraisalFinalizationRequestedNotification`** — notifies HR after calibration.
- **`AbstractAppraisalNotification`** — all workflow notifications support **database + mail** when SMTP is enabled (queued via `ShouldQueue`).
- **Goal plan submit** now fires `goal_plan_submitted` (previously had no notification event).

### Email requirements
- Enable **SMTP Email Notifications** in Settings and configure SMTP host/credentials.
- Run a queue worker — notifications are queued:
  ```bash
  php artisan queue:work
  ```

Each email includes employee name, review cycle, and a link to open the appraisal.

### Key files
- `app/Services/Performance/AppraisalWorkflowNotificationService.php`
- `app/Listeners/Performance/SendAppraisalWorkflowNotifications.php`
- `app/Services/Performance/AppraisalWorkflowService.php`
- `app/Notifications/Performance/AbstractAppraisalNotification.php`
- `app/Notifications/Performance/AppraisalStepCompletedNotification.php`
- `app/Notifications/Performance/AppraisalFinalizationRequestedNotification.php`
- `app/Support/Notifications/PerformanceNotificationChannels.php`
- `tests/Feature/Performance/AppraisalWorkflowNotificationTest.php`

---

## Verification

Run targeted tests:

```bash
php artisan test tests/Feature/Issues/IssueReportTest.php
php artisan test tests/Feature/Performance/DashboardGoalsTabTest.php
php artisan test tests/Feature/Performance/AppraisalWorkflowNotificationTest.php
```

---

## Related documentation

- Broader session history: `docs/session-changes-summary.md`
- Demo credentials for performance trends: `docs/employee-performance-trend-demo-credentials.md`
