# Appraisal Scoring - How Calculation Works

This document explains how performance scores are calculated in the application. The logic lives in `App\Services\Performance\AppraisalScoringService`.

---

## Overview

An appraisal can produce three numeric scores, stored as 0-100 percentages:

| Score | What it measures |
| --- | --- |
| **Business score** | Weighted average of manager ratings on business objectives |
| **Values score** | Average of manager ratings on competencies, values, or behaviours |
| **Overall score** | Final score used for rating bands and reports |

A final rating label, such as "Meets Expectations", is chosen by mapping the overall score onto the template's overall rating scale percentage bands.

Only manager ratings are used in the numeric calculation. Self-assessment ratings are captured for review and evidence, but they do not feed the final score.

---

## When scores are calculated

Scores are computed and saved when:

1. The approving manager approves the appraisal and it moves to calibration pending.
2. A manager recalculates from the manager review screen.
3. The appraisal is finalized, which refreshes scores before locking the appraisal.

Until approval, `business_score`, `values_score`, and `overall_score` may be empty or stale.

---

## Inputs

### Rating scales

Each appraisal template links three rating scales:

| Scale | Purpose |
| --- | --- |
| **Objective scale** | Used for manager ratings on business objectives |
| **Competency scale** | Used for manager ratings on values or competencies |
| **Overall scale** | Used to map the final overall score to a rating label |

Each scale level has a numeric `value`, for example 1-5. The system uses the maximum `value` on that scale as the denominator for normalization.

Example: if the highest level is `5`, a manager rating of `4` normalizes to `(4 / 5) * 100 = 80%`.

### Objective weights

Each business objective has a percentage weight.

- Objectives included in the business score must total 100% before goal plan submission.
- Only objectives with `include_in_business_score = true` are included in the business score.
- Objectives without a manager rating contribute `0` until rated.

### Template weight split

The appraisal stores the business and values weight split copied from the template at assignment:

- `business_weight_percent`, usually 80.
- `values_weight_percent`, usually 20.

When values ratings exist, these weights control the overall score blend. When values ratings do not exist, values are excluded from the calculation and the overall score is based on business score only.

---

## 1. Business Score

For each objective that is included in the business score and has a manager rating:

```text
normalized_percent = (manager_rating_score / objective_scale_max) * 100
contribution       = normalized_percent * (objective_weight / 100)
```

Business score is the sum of all objective contributions, rounded to 2 decimal places.

### Example

| Objective | Weight | Manager rating | Normalized | Contribution |
| --- | ---: | ---: | ---: | ---: |
| Revenue growth | 60% | 4 / 5 | 80% | 48.00 |
| Customer NPS | 40% | 5 / 5 | 100% | 40.00 |
| **Business score** | | | | **88.00** |

---

## 2. Values Score

For each competency or values row with a manager rating:

```text
normalized_percent = (manager_rating_score / competency_scale_max) * 100
```

Values score is the average of those normalized percentages, rounded to 2 decimal places.

If no manager values ratings have been provided, `values_score` is saved as `null` and treated as not applicable. Missing values ratings are not treated as `0`, because that would unfairly reduce the final score when the values section was not completed or not used.

### Example

Competency scale max = 5.

| Competency | Manager rating | Normalized |
| --- | ---: | ---: |
| Communication | 4 / 5 | 80% |
| Teamwork | 5 / 5 | 100% |
| Accountability | 3 / 5 | 60% |
| **Values score** | | **80.00** |

---

## 3. Overall Score

Overall score uses one of two calculation paths.

### Business + Values

When at least one manager values rating exists:

```text
overall_score =
  (business_score * business_weight_percent + values_score * values_weight_percent) / 100
```

Example with an 80 / 20 split:

```text
business_score = 88.00
values_score   = 80.00
overall_score  = (88 * 80 + 80 * 20) / 100 = 86.40
```

### Business Only

When no manager values ratings exist:

```text
values_score  = null
overall_score = business_score
```

Example:

```text
business_score = 88.00
values_score   = null
overall_score  = 88.00
```

This ensures an appraisal that only has business ratings is calculated only from business performance.

---

## 4. Final Rating Label

After `overall_score` is known, the system finds the first level on the template's overall rating scale where:

```text
min_percent <= overall_score <= max_percent
```

If `min_percent` or `max_percent` is null, that bound is ignored.

The matching level's label becomes the final rating and is stored as `overall_rating_scale_level_id`. If no band matches, the last level on the scale is used as a fallback.

---

## Calibration

After approval, a calibration committee may review the appraisal — **unless the tenant has disabled Calibration** in Settings (`organization_settings.calibration_enabled = false`).

When Calibration is **enabled**:

- **Confirm**: calibrated overall score stays the same as calculated `overall_score`.
- **Adjust**: committee sets a new `calibrated_overall_score` and optional calibrated rating level.

When Calibration is **disabled**:

- Approval auto-copies overall scores into calibrated fields, sets `calibrated_at`, and records that Calibration was skipped by tenant setting.
- Finalize proceeds without a human calibrator.

For display and reports, the effective overall score is:

```text
effective_overall = calibrated_overall_score ?? overall_score
```

Business and values scores are not recalculated during calibration. Only the overall outcome may be adjusted.

---

## UI and Exports

| Location | Scores shown |
| --- | --- |
| Score Summary card | Business %, Values %, Overall %, rating label |
| PDF / Excel export | Same, via `ScoreFormatter::summaryFor()` |
| Dashboard trend | Uses effective overall score on finalized appraisals |
| Reports / dashboards | Usually `coalesce(calibrated_overall_score, overall_score)` |

Percentages are displayed as whole numbers, for example `86%`, via `ScoreFormatter::formatPercent()`.

When values score is `null`, the UI should display values as not applicable or empty rather than as `0%`.

---

## Code Reference

```php
// app/Services/Performance/AppraisalScoringService.php

// Business: weighted sum of normalized manager objective ratings.
$businessScore = sum(
    (manager_rating / objectiveMax * 100) * (weight / 100)
);

// Values: average of normalized manager competency ratings,
// or null when no values ratings have been submitted.
$valuesScore = $competencyRatings->isNotEmpty()
    ? average(manager_rating / competencyMax * 100)
    : null;

// Overall: business-only if values are not applicable,
// otherwise use the template split.
$overallScore = $valuesScore === null
    ? $businessScore
    : (
        $businessScore * $appraisal->business_weight_percent
        + $valuesScore * $appraisal->values_weight_percent
    ) / 100;
```

---

## Related Documentation

- `docs/performance-concepts.md` - perspectives, competencies, rating scales
- `SYSTEM.md` - full workflow including scoring model section
- `docs/USER_MANUAL.md` - short scoring summary for end users
