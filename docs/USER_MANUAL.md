# General User Manual

## Purpose

This manual explains how to navigate the Employee Performance Appraisal System, understand the review workflow, and find the right actions at each stage.

## Main Navigation Areas

- `Dashboard`: personal work queue, pending reviews, cycle snapshots, and overdue actions
- `Setup`: departments, job titles, perspectives, competencies, and rating scales
- `Employees`: employee profiles, reporting lines, and employee readiness
- `Review Cycles`: cycle creation, opening, closing, and assignment tracking
- `Templates`: appraisal structure, weights, competency inclusion, and scale setup
- `Goal Library`: reusable SMART objective examples
- `Appraisals`: planning, self assessment, manager review, approval, and finalization
- `Development Plans`: strengths, gaps, actions, and follow-up items
- `Reports`: completion, summaries, distribution, and exports
- `Access Users` and `Access Roles`: account and permission administration
- `Help & Docs`: workflow guidance, role manuals, diagrams, and technical references

## End-to-End Workflow

### 1. Setup

HR or system administrators define the structure used by the appraisal process:

- departments
- job titles
- perspectives
- competencies and values
- rating scales
- templates

### 2. Employee readiness

Each signed-in user should be linked to an employee profile. The profile captures:

- employee number
- department and job title
- reporting line
- employment details
- review eligibility

### 3. Review cycle assignment

HR creates a cycle, sets deadlines, and assigns employees to that cycle with the appropriate template.

### 4. Goal planning

Employees and managers define SMART objectives. Objective weights must add up to `100`.

### 5. Self assessment

Employees record:

- performance achieved
- self ratings
- comments
- achievements and issues
- evidence

### 6. Manager review

Managers assess the submission, add ratings and comments, and either:

- send back for correction
- submit forward for approval

### 7. Approval

Approving managers review the appraisal and decide whether to:

- approve
- send back

### 8. Finalization

HR or authorized administrators finalize approved records so scores and outputs are locked.

### 9. Reporting and export

Reports, Excel exports, print views, and final PDFs become available after the workflow progresses.

## Common Statuses

- `draft`
- `goal_setting`
- `self_assessment_pending`
- `self_assessment_submitted`
- `manager_review_pending`
- `manager_review_completed`
- `approval_pending`
- `approved`
- `sent_back`
- `finalized`

## Scoring Summary

- business objectives use weighted scoring
- competency or values scoring is calculated separately
- the final overall score combines business and values scores using the configured template weights
- the final numeric score maps to an overall rating label through the selected rating scale

## Evidence and Comments

Evidence can be stored as uploads or links. Comments may be captured at objective level or appraisal level depending on the stage of review.

## Permissions and Access

Access is controlled by permissions and policies, not by hardcoded role checks in the user interface.

## Support Guidance

- If you cannot see a page, check whether you have the required permission.
- If you are redirected to complete your employee profile, finish that step before using the dashboard.
- If you are impersonating another user, stop impersonation from the sidebar when finished.
- Use the audit trail for change visibility and accountability.
