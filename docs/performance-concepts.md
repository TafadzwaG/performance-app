# Performance Appraisal Concepts

## 1) Perspective

A **perspective** is a category used to group appraisal objectives so performance is balanced across different business areas, not just one focus.

Common perspectives in this system:

- Financial
- Customer
- Internal Process
- Learning/Growth
- Behaviours/Values

### Example

- Perspective: **Customer**
- Objective: “Improve customer satisfaction response time”
- KPI/Measure: “Average first response time”
- Target: “Reduce from 6 hours to 2 hours by end of cycle”
- Weight: “20%”
- Evidence Source: “Helpdesk monthly report”

---

## 2) Competencies

**Competencies** are the behaviors, skills, and values that describe **how** someone performs work, not just **what** results they deliver.

Typical competency areas:

- Communication
- Teamwork
- Accountability
- Problem Solving
- Leadership
- Integrity / Customer Focus

In this system, competencies are rated separately from business objectives to produce the **values/competency score**.

### Example

- Competency: **Communication**
- Description: “Shares clear updates and listens actively”
- Manager Rating: `4/5`
- Comment: “Consistently communicates priorities and blockers clearly.”

---

## 3) Rating Scales

A **rating scale** is the scoring framework that converts performance judgments into consistent numeric levels and labels.

In this system, rating scales are admin-configurable and used for:

- Objective ratings
- Competency/values ratings
- Final overall rating mapping

### Example 5-Level Scale

- `1` = Unsatisfactory
- `2` = Needs Improvement
- `3` = Meets Expectations
- `4` = Exceeds Expectations
- `5` = Outstanding

Each level can include:

- Numeric value (for score calculations)
- Label / short label
- Optional percentage range (`min_percent`, `max_percent`) for final mapping
- Sort order
- Color

### Final Mapping Example

If an appraisal’s final score is `78%`, the system maps it to the level whose percentage range contains `78%` (for example: **Exceeds Expectations**, depending on configured ranges).
