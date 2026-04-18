# Client Presentation Guide: Performance Appraisal System

## 1. Opening (2–3 min) — Frame the Problem

Start with the pain points your client currently faces:

- Manual/spreadsheet-based appraisals are error-prone and slow
- No visibility into where reviews get stuck in the pipeline
- No audit trail — who approved what, and when?
- Managers and employees lack a shared workspace for goal-setting

**Tip:** Ask your client beforehand what their biggest frustration is with their current process, and open with that.

---

## 2. System Overview (3–5 min) — The Big Picture

Walk through the **5 roles** and what each person sees:

- **Employee** → sets goals, self-assesses, uploads evidence
- **Manager** → reviews team, rates objectives, sends back or forwards
- **Approving Manager** → final quality gate before sign-off
- **HR Admin** → manages cycles, templates, employees, reports
- **Super Admin** → full system control + audit trail

Show the **workflow stepper** (visible on every appraisal page) to illustrate the lifecycle:

> Draft → Goal Setting → Self-Assessment → Manager Review → Approval → Finalized

---

## 3. Live Demo Flow (15–20 min) — Walk the Full Lifecycle

Use your **seeded demo data** (run `php artisan db:seed` — it creates realistic company data with 10+ employees across HR, Engineering, Sales, Operations).

### Demo in this order — it tells a story:

| Step | Log in as | Show |
|------|-----------|------|
| **A. Setup** | HR Admin | Departments, Job Titles, Rating Scales, Competencies — show these are pre-configured |
| **B. Template** | HR Admin | Open an Appraisal Template — show how objectives + competencies + rating scales are bundled |
| **C. Create Cycle** | HR Admin | Show a Review Cycle with deadlines (goal-setting, self-assessment, manager review, approval) |
| **D. Assign Employees** | HR Admin | Bulk-assign employees to a cycle — show the batch assignment UI |
| **E. Goal Planning** | Employee | Open an appraisal → Plan page. Add objectives from the **Goal Library** or freeform. Set weights (must total 100%). Save as draft, then Submit |
| **F. Self-Assessment** | Employee | Rate own objectives, upload evidence files, add comments |
| **G. Manager Review** | Manager | Rate the employee's objectives + competencies. Show the **score recalculation** button. Add overall comment. Submit Forward or Send Back |
| **H. Approval** | Approving Manager | Review final scores, approve or send back with feedback |
| **I. Finalization** | HR Admin | Finalize the appraisal — show it locks and a **Development Plan** is created |
| **J. Reports** | HR Admin | Dashboard metrics → Cycle Summary → Department Summary → Rating Distribution. Export to Excel. Print individual appraisal as PDF |
| **K. Audit Trail** | Super Admin | Show the full action log with filters |

### Pro tips for the demo:

- Keep **two browser windows open** (Employee + Manager) to show the handoff in real time
- Deliberately **Send Back** one appraisal to show the feedback loop — clients love this
- Show the **PDF print** of a finalized appraisal — it's tangible output they can picture using

---

## 4. Key Differentiators (3–5 min) — Why This System

Highlight these standout features:

- **Goal Library** — reusable objectives by department, saves time across hundreds of employees
- **Weighted scoring** — configurable business (80%) vs. values (20%) split with automatic calculation
- **Evidence attachments** — employees prove their achievements with uploaded documents
- **Send-back workflow** — not just approve/reject, but targeted reopening of specific stages
- **Development Plans** — auto-created post-finalization with action items, owners, and progress tracking
- **Full audit trail** — every action logged with user, timestamp, IP address
- **Bulk operations** — CSV import for employees, batch cycle assignment
- **Role-based access** — 50+ granular permissions, 5 pre-configured roles

---

## 5. Technical Credibility Slide (2 min) — For IT Stakeholders

If technical people are in the room:

- **Stack:** Laravel 12, React 19, MySQL — modern, maintainable, well-supported
- **Security:** Rate-limited auth, role-based policies on every action, CSRF protection
- **Performance:** Dashboard caching, composite indexes, eager-loaded queries
- **Export:** PDF (DomPDF) + Excel (OpenSpout) — no external service dependencies
- **Deployment:** Standard LAMP/LEMP stack, no exotic infrastructure needed

---

## 6. Closing (2–3 min) — Next Steps

- Summarize the full lifecycle they just saw
- Ask: *"Which part of this workflow would save your team the most time?"*
- Propose a pilot: 1 department, 1 review cycle, 10–20 employees
- Offer a timeline for customization (branding, additional fields, integrations)

---

## Preparation Checklist

- [ ] Run `php artisan db:seed` so demo data is fresh
- [ ] Run `php artisan migrate` so all features (including soft-deletes) work
- [ ] Pre-create 2–3 appraisals at different workflow stages (draft, self-assessment, manager review)
- [ ] Test the PDF export and Excel download beforehand
- [ ] Have login credentials printed/noted for each role you'll demo
- [ ] Prepare a backup plan — screenshots of each page in case of connectivity issues
