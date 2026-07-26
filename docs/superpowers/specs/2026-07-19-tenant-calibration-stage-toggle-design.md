# Tenant Calibration Stage Toggle — Design Spec

**Date:** 2026-07-19  
**Status:** Approved for implementation planning  
**Scope:** v1 — optional Calibration stage only (Approach 1)

## Problem

AppraisalSteps and the backend workflow hard-code a six-stage pipeline ending in Calibration. Some tenants do not use Calibration. Today, Approval always moves appraisals to `calibration_pending`, and Finalize requires `calibrated_at`, so those tenants get stuck on a stage they do not need.

## Goals

- Tenant Super Admin can turn Calibration on/off for their organization from the Settings page.
- When off, AppraisalSteps omits Calibration and renumbers remaining stages.
- When off, Approval advances appraisals to finalize-ready without a human calibrator.
- Turning Calibration off immediately unblocks appraisals already waiting on Calibration.
- One resolver is the source of truth for workflow, policies, navigation, abilities, and UI.

## Non-goals (v1)

- Enabling/disabling Goal Setting, Self Assessment, Manager Review, Approval, or Final Record.
- Reordering stages.
- Platform-admin-only org workflow editor.
- Reopening finalized appraisals when Calibration is re-enabled.

## Decisions

| Decision | Choice |
|---|---|
| Optional stages in v1 | Calibration only |
| Who configures | Tenant Super Admin via `/settings` (`system.settings.manage`) |
| Storage | `organization_settings.calibration_enabled` boolean, default `true` |
| In-flight appraisals when toggled off | Apply immediately — auto-skip Calibration |
| Architecture | Feature flag + `AppraisalWorkflowConfig` resolver (Approach 1) |

## Data model

### Migration

Add to `organization_settings`:

```php
$table->boolean('calibration_enabled')->default(true);
```

- Existing rows inherit `true` via default / backfill.
- `OrganizationSetting` fillable + casts: `'calibration_enabled' => 'boolean'`.

### Resolver

New service: `App\Services\Performance\AppraisalWorkflowConfig`

Responsibilities:

- Read current tenant’s `OrganizationSetting` via `TenantContext`.
- Expose:
  - `calibrationEnabled(): bool` (default `true` if setting row missing)
  - `enabledStages(): array` of `WorkflowStage` values in fixed order, omitting `Calibration` when disabled
  - `isStageEnabled(WorkflowStage $stage): bool`

Callers must not query `organization_settings` directly for workflow decisions.

## Settings UI

### Location

`resources/js/pages/settings/index.tsx` — General tab, new **Appraisal workflow** card.

### Control

- Label: **Require Calibration stage**
- Type: switch/checkbox bound to `calibration_enabled`
- Helper copy: When off, Approval goes straight to Final Record. Appraisals already waiting on Calibration become finalize-ready immediately.
- Visible/editable only when `can.manageSettings` is true (`system.settings.manage`).

### Persistence

Extend `SystemSettingsController::update` validation and tenant settings update to include `calibration_enabled` (boolean, required when managing settings).

On save, if the value changes from `true` → `false`, run the in-flight auto-skip job/service (see Workflow) inside the same request transaction (or immediately after settings update) for the current organization only.

## Workflow behavior

### Calibration ON (unchanged)

```text
Approve → status=calibration_pending, approved_at set, calibrated_* cleared
Human calibrate → calibrated_at + calibrated scores
Finalize → requires status=calibration_pending AND calibrated_at
```

### Calibration OFF — on Approve

`AppraisalWorkflowService::approve`:

1. Compute/persist overall scores and `approved_at` as today.
2. Instead of leaving the appraisal for a human calibrator:
   - Copy overall score fields into calibrated score fields (`calibrated_overall_score`, `calibrated_overall_rating_scale_level_id`, and any sibling calibrated fields already used by reports).
   - Set `calibrated_at = now()`.
   - Set `calibrated_by_user_id = null` (system skip; not a human calibrator).
   - Persist a short `calibration_comment` such as: `Calibration skipped by tenant setting.`
3. Status remains `calibration_pending` with `calibrated_at` set so existing Finalize gates (`status === CalibrationPending && calibrated_at`) continue to work without inventing a new status.
4. Do **not** dispatch `calibration_requested` notifications.
5. Record status/approval history noting auto-skip.

### Calibration OFF — Finalize

`finalize` continues to require `calibration_pending` + `calibrated_at`. Because Approve (or the settings toggle) auto-sets `calibrated_at`, Finalize works without a human Calibration step.

Policy `finalizationUnlocked` / `calibrate` abilities:

- When Calibration is disabled, `calibrate` / `calibrateEdit` abilities are forced `false`.
- Calibration routes (`edit`/`store`) abort 403 or redirect to finalize/show when the stage is disabled.

### Settings toggle OFF — in-flight

For the current organization, every appraisal where:

- `status = calibration_pending`
- `calibrated_at` is null

…is auto-advanced with the same score-copy + `calibrated_at` + history note rules as Approve-when-off.

Already calibrated or finalized appraisals are left unchanged.

### Settings toggle ON

- Future Approvals resume requiring human Calibration (`calibrated_at` cleared on approve as today).
- Does not reopen finalized appraisals.
- Does not strip `calibrated_at` from appraisals already auto-skipped.

## UI & navigation

### Shared Inertia prop

Expose from `HandleInertiaRequests` (or appraisal view builders):

```ts
workflow: {
  calibration_enabled: boolean
  enabled_stages: AppraisalStepKey[] // final_record maps from WorkflowStage::Finalization
}
```

### `AppraisalSteps.tsx`

- Filter `buildAppraisalSteps()` by `enabled_stages` / `calibration_enabled`.
- Replace hard-coded `grid-cols-6` with dynamic column count (`grid-cols-{n}` or inline style / Tailwind safelist).
- Renumber titles `1…N` from the filtered list.
- Continue/waiting actions automatically omit Calibration when filtered out.

### Backend twin

`AppraisalNavigationService::steps()` must use the same `AppraisalWorkflowConfig` filtering so post-submit redirects match the UI.

### Other steppers

Update or deprecate parallel hardcoded steppers that still show six stages (`AppraisalWorkflowStepper` / JourneyCard / StepWizard) so they respect the same config. Prefer one shared builder if cheap; otherwise filter each caller.

### Pending nav & notifications

- `PendingAppraisalNavService`: skip calibration action scope when disabled.
- `AppraisalWorkflowNotificationService`: do not send calibration-requested (or equivalent) when disabled / on auto-skip.

## Permissions

| Action | Permission |
|---|---|
| Toggle Calibration | `system.settings.manage` |
| Perform Calibration (when enabled) | existing `performance.appraisals.calibrate` |
| Perform Calibration (when disabled) | denied via policy/abilities regardless of role |

## Scoring & reports

No report query changes required if auto-skip copies overall → calibrated fields. Existing `coalesce(calibrated_*, overall_*)` continues to work.

Document the skip behavior in `docs/scoring-calculation.md` Calibration section.

## Testing

| Case | Expectation |
|---|---|
| Super Admin updates `calibration_enabled` | Persists on `organization_settings` |
| Unauthorized user | 403 |
| Calibration off → approve | `calibrated_at` set, no calibration notification, finalize allowed |
| Calibration off → finalize | Succeeds without visiting Calibration |
| Toggle off with in-flight `calibration_pending` | Those appraisals get `calibrated_at` and become finalize-ready |
| Calibration on (regression) | Approve → human calibrate → finalize still works |
| Steps UI / nav | Calibration omitted when off; present when on |
| Pending nav | No calibrate tasks when off |
| Ability map | `calibrate` false when off |

## Implementation touchpoints (expected)

- Migration + `OrganizationSetting`
- `AppraisalWorkflowConfig` (new)
- `SystemSettingsController` + `resources/js/pages/settings/index.tsx`
- `AppraisalWorkflowService` (approve + auto-skip helper)
- `AppraisalPolicy` / `BuildsPerformanceViewData` abilities
- `AppraisalNavigationService`, `PendingAppraisalNavService`, `AppraisalWorkflowNotificationService`
- `HandleInertiaRequests` (shared prop)
- `AppraisalSteps.tsx` (+ other steppers if still live)
- Tests under `tests/Feature/Performance/` and settings tests
- `docs/scoring-calculation.md` note

## Future extension

When more optional stages are needed, replace the boolean with `enabled_workflow_stages` JSON while keeping `AppraisalWorkflowConfig` as the public API so callers do not change.
