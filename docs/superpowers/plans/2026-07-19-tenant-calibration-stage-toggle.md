# Tenant Calibration Stage Toggle — Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Let tenant Super Admins disable the Calibration appraisal stage from Settings; when off, workflow skips Calibration and UI/nav/notifications follow.

**Architecture:** `organization_settings.calibration_enabled` + `AppraisalWorkflowConfig` resolver. Approve (and settings toggle-off) auto-sets calibrated fields so existing finalize gates keep working. Frontend filters `AppraisalSteps` from shared Inertia props.

**Tech Stack:** Laravel, Inertia/React, PHPUnit feature tests, Spatie permissions

## Global Constraints

- Only Calibration is optional in v1
- Default `calibration_enabled = true`
- In-flight `calibration_pending` appraisals auto-skip when toggle turns off
- Do not invent a new appraisal status; keep `calibration_pending` + auto `calibrated_at`

---

### Task 1: Migration + model + config resolver

**Files:**
- Create: `database/migrations/2026_07_19_140000_add_calibration_enabled_to_organization_settings.php`
- Modify: `app/Models/OrganizationSetting.php`
- Create: `app/Services/Performance/AppraisalWorkflowConfig.php`
- Test: `tests/Feature/Performance/AppraisalWorkflowConfigTest.php`

- [ ] Write failing tests for default true, false when disabled, enabledStages list
- [ ] Add migration + model cast/fillable
- [ ] Implement `AppraisalWorkflowConfig`
- [ ] Run tests green

### Task 2: Settings persistence + in-flight auto-skip

**Files:**
- Modify: `app/Http/Controllers/Settings/SystemSettingsController.php`
- Modify: `resources/js/pages/settings/index.tsx`
- Modify: `app/Services/Performance/AppraisalWorkflowService.php` (auto-skip helper)
- Test: `tests/Feature/Settings/SystemSettingsTest.php` (or new calibration settings test)

- [ ] Failing test: Super Admin can toggle; unauthorized 403; toggle off advances pending calibrations
- [ ] Wire controller validation/update + call skip helper
- [ ] Add Settings UI card
- [ ] Tests green

### Task 3: Workflow approve path when calibration disabled

**Files:**
- Modify: `app/Services/Performance/AppraisalWorkflowService.php`
- Modify: `app/Policies/AppraisalPolicy.php`
- Modify: `app/Http/Controllers/Performance/Concerns/BuildsPerformanceViewData.php`
- Modify: notification + pending nav services
- Test: extend `tests/Feature/Performance/CalibrationWorkflowTest.php`

- [ ] Failing tests: approve auto-skips; finalize without human calibrate; no calibration notification; regression when enabled
- [ ] Implement approve branch + ability/policy gates
- [ ] Tests green

### Task 4: Frontend steps + shared props

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php` and/or view builders
- Modify: `resources/js/components/performance/AppraisalSteps.tsx`
- Modify: `app/Services/Performance/AppraisalNavigationService.php`
- Update other live steppers if needed
- Update: `docs/scoring-calculation.md` Calibration note

- [ ] Filter steps dynamically; dynamic grid columns
- [ ] Sync navigation service
- [ ] Docs note
- [ ] Smoke via feature tests already covering abilities/redirects

### Task 5: Verification

- [ ] Run targeted PHPUnit suites
- [ ] Fix any failures
