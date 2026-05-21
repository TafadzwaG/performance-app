<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Perspective;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Seeds at least four active goal-library items per hotel job title (role),
 * plus four department-wide goals per department (no job title).
 *
 * Requires PerformanceSetupSeeder (perspectives) and HotelOrgStructureSeeder
 * (departments + job titles) to have run first.
 */
class JobTitleGoalLibrarySeeder extends Seeder
{
    private const GOALS_PER_SCOPE = 4;

    private const PERSPECTIVE_CODES = [
        'financial',
        'customer',
        'internal_process',
        'learning_growth',
    ];

    public function run(): void
    {
        $perspectives = Perspective::query()
            ->where('is_active', true)
            ->whereIn('code', self::PERSPECTIVE_CODES)
            ->get()
            ->keyBy('code');

        if ($perspectives->count() < self::GOALS_PER_SCOPE) {
            $this->command?->warn('Run PerformanceSetupSeeder first — balanced scorecard perspectives are missing.');

            return;
        }

        $jobTitleCount = 0;
        $jobGoalCount = 0;
        $departmentGoalCount = 0;

        JobTitle::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->each(function (JobTitle $jobTitle) use ($perspectives, &$jobTitleCount, &$jobGoalCount) {
                $department = $this->resolveDepartmentForJobTitle($jobTitle);

                if (! $department) {
                    $this->command?->warn("Skipping job title [{$jobTitle->name}] — no matching department.");

                    return;
                }

                $jobTitleCount++;

                foreach ($this->goalsForScope($department->name, $jobTitle->name, false) as $goal) {
                    $this->upsertGoal($department, $jobTitle, $goal, $perspectives);
                    $jobGoalCount++;
                }
            });

        Department::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->each(function (Department $department) use ($perspectives, &$departmentGoalCount) {
                foreach ($this->goalsForScope($department->name, null, true) as $goal) {
                    $this->upsertGoal($department, null, $goal, $perspectives);
                    $departmentGoalCount++;
                }
            });

        $this->command?->info("Job titles seeded: {$jobTitleCount} ({$jobGoalCount} role-specific goals).");
        $this->command?->info("Department-wide goals seeded: {$departmentGoalCount}.");
    }

    private function resolveDepartmentForJobTitle(JobTitle $jobTitle): ?Department
    {
        if ($jobTitle->description && str_contains($jobTitle->description, ' — ')) {
            $departmentName = trim(Str::before($jobTitle->description, ' —'));

            $department = Department::query()
                ->where('name', $departmentName)
                ->where('is_active', true)
                ->first();

            if ($department) {
                return $department;
            }
        }

        $mappedDepartmentName = $this->jobTitleDepartmentNameMap()[$jobTitle->code] ?? null;

        if ($mappedDepartmentName) {
            $department = Department::query()
                ->where('name', $mappedDepartmentName)
                ->where('is_active', true)
                ->first();

            if ($department) {
                return $department;
            }
        }

        $profileDepartmentId = EmployeeProfile::query()
            ->where('job_title_id', $jobTitle->id)
            ->whereNotNull('department_id')
            ->value('department_id');

        if ($profileDepartmentId) {
            return Department::query()->find($profileDepartmentId);
        }

        return null;
    }

    /**
     * @return array<string, string>
     */
    private function jobTitleDepartmentNameMap(): array
    {
        return [
            'hrbp' => 'Human Capital',
            'rom' => 'Operations',
            'hoo' => 'Operations',
            'dsm' => 'Digital Services',
            'coo' => 'Operations',
            'fm' => 'Finance',
            'hof' => 'Finance',
            'fino' => 'Finance',
            'sa' => 'Digital Services',
            'rm' => 'Commercial Banking',
            'cxo' => 'Customer Experience',
            'opa' => 'Operations',
            'pso' => 'Digital Services',
            'dpo' => 'Human Capital',
        ];
    }

    /**
     * @return list<array{
     *     perspective: string,
     *     title: string,
     *     description: string,
     *     kpi_measure: string,
     *     target_definition: string,
     *     evidence_source: string,
     *     timeline_days: int,
     *     default_weight: float
     * }>
     */
    private function goalsForScope(string $departmentName, ?string $positionName, bool $departmentWide): array
    {
        $label = $departmentWide ? $departmentName.' department' : $positionName;
        $themes = $this->departmentThemes($departmentName);

        return [
            [
                'perspective' => 'financial',
                'title' => "{$label}: {$themes['financial']['title']}",
                'description' => $departmentWide
                    ? "Department financial objective for {$departmentName}."
                    : "Financial performance objective for the {$positionName} role in {$departmentName}.",
                'kpi_measure' => $themes['financial']['kpi'],
                'target_definition' => $themes['financial']['target'],
                'evidence_source' => $themes['financial']['evidence'],
                'timeline_days' => 365,
                'default_weight' => 25,
            ],
            [
                'perspective' => 'customer',
                'title' => "{$label}: {$themes['customer']['title']}",
                'description' => $departmentWide
                    ? "Guest and customer experience standard for {$departmentName}."
                    : "Service delivery objective for {$positionName} supporting guest satisfaction.",
                'kpi_measure' => $themes['customer']['kpi'],
                'target_definition' => $themes['customer']['target'],
                'evidence_source' => $themes['customer']['evidence'],
                'timeline_days' => 270,
                'default_weight' => 25,
            ],
            [
                'perspective' => 'internal_process',
                'title' => "{$label}: {$themes['internal_process']['title']}",
                'description' => $departmentWide
                    ? "Operational excellence and controls for {$departmentName}."
                    : "Process efficiency and compliance objective for {$positionName}.",
                'kpi_measure' => $themes['internal_process']['kpi'],
                'target_definition' => $themes['internal_process']['target'],
                'evidence_source' => $themes['internal_process']['evidence'],
                'timeline_days' => 180,
                'default_weight' => 25,
            ],
            [
                'perspective' => 'learning_growth',
                'title' => "{$label}: {$themes['learning_growth']['title']}",
                'description' => $departmentWide
                    ? "Capability building and cross-training for {$departmentName}."
                    : "Skills development and coaching objective for {$positionName}.",
                'kpi_measure' => $themes['learning_growth']['kpi'],
                'target_definition' => $themes['learning_growth']['target'],
                'evidence_source' => $themes['learning_growth']['evidence'],
                'timeline_days' => 365,
                'default_weight' => 25,
            ],
        ];
    }

    /**
     * @return array<string, array{title: string, kpi: string, target: string, evidence: string}>
     */
    private function departmentThemes(string $departmentName): array
    {
        $themes = [
            'Front Office' => [
                'financial' => ['title' => 'Maximise room and ancillary revenue', 'kpi' => 'RevPAR and upsell conversion', 'target' => 'Achieve budgeted RevPAR and 8% upsell rate on arrivals', 'evidence' => 'PMS revenue reports'],
                'customer' => ['title' => 'Deliver outstanding arrival and departure experiences', 'kpi' => 'Guest satisfaction score (arrival/departure)', 'target' => 'Maintain GSS at or above 4.5/5', 'evidence' => 'Guest feedback surveys'],
                'internal_process' => ['title' => 'Streamline check-in and reservations accuracy', 'kpi' => 'Average check-in time and booking error rate', 'target' => 'Check-in under 4 minutes; booking errors below 1%', 'evidence' => 'Front office operations log'],
                'learning_growth' => ['title' => 'Strengthen product knowledge and service standards', 'kpi' => 'Training completion and coaching sessions', 'target' => '100% completion of quarterly service training', 'evidence' => 'HR training records'],
            ],
            'Housekeeping' => [
                'financial' => ['title' => 'Control linen and amenity costs', 'kpi' => 'Cost per occupied room (housekeeping)', 'target' => 'Keep CPOR within budget variance of 3%', 'evidence' => 'Cost control reports'],
                'customer' => ['title' => 'Maintain room cleanliness and presentation standards', 'kpi' => 'Room inspection pass rate', 'target' => 'Achieve 96% first-pass inspection score', 'evidence' => 'Housekeeping QA checklist'],
                'internal_process' => ['title' => 'Improve room turnaround time', 'kpi' => 'Average room cleaning turnaround (minutes)', 'target' => 'Turnaround within 28 minutes for standard rooms', 'evidence' => 'Floor supervisor log'],
                'learning_growth' => ['title' => 'Cross-train on laundry and public area standards', 'kpi' => 'Cross-training modules completed', 'target' => 'Each team member completes two cross-training modules', 'evidence' => 'Training attendance register'],
            ],
            'Kitchen' => [
                'financial' => ['title' => 'Manage food cost and wastage', 'kpi' => 'Food cost percentage and wastage', 'target' => 'Food cost at or below 32%; wastage under 4%', 'evidence' => 'Kitchen cost reports'],
                'customer' => ['title' => 'Consistent food quality and ticket times', 'kpi' => 'Guest meal complaints and ticket time', 'target' => 'Complaints below 2%; mains ticket time under 18 minutes', 'evidence' => 'F&B feedback and kitchen display'],
                'internal_process' => ['title' => 'HACCP and kitchen safety compliance', 'kpi' => 'Health inspection findings and safety audits', 'target' => 'Zero critical findings; 100% daily safety checks', 'evidence' => 'Safety and hygiene audit log'],
                'learning_growth' => ['title' => 'Develop culinary skills and menu knowledge', 'kpi' => 'Skills workshops and recipe certifications', 'target' => 'Complete two skills workshops per chef per year', 'evidence' => 'Chef development plan'],
            ],
            'Food and Beverage' => [
                'financial' => ['title' => 'Grow outlet revenue and beverage sales', 'kpi' => 'Outlet revenue per cover and beverage mix', 'target' => 'Meet outlet revenue budget; beverage upsell 12%', 'evidence' => 'POS and outlet reports'],
                'customer' => ['title' => 'Elevate dining and bar service experience', 'kpi' => 'Guest satisfaction (F&B outlets)', 'target' => 'Outlet GSS at or above 4.4/5', 'evidence' => 'Guest comment cards'],
                'internal_process' => ['title' => 'Accurate orders and cash handling', 'kpi' => 'Order accuracy and cashier variances', 'target' => 'Order accuracy 98%; cash variances below 0.5%', 'evidence' => 'Outlet shift reports'],
                'learning_growth' => ['title' => 'Menu, wine, and service training', 'kpi' => 'Product knowledge assessments passed', 'target' => 'Pass quarterly menu knowledge assessment', 'evidence' => 'F&B training records'],
            ],
        ];

        return $themes[$departmentName] ?? [
            'financial' => ['title' => 'Meet budget and cost targets', 'kpi' => 'Budget variance (%)', 'target' => 'Deliver within 2% of approved department budget', 'evidence' => 'Management accounts'],
            'customer' => ['title' => 'Strengthen service quality', 'kpi' => 'Internal/external customer satisfaction', 'target' => 'Achieve satisfaction score at or above 4.3/5', 'evidence' => 'Feedback and survey results'],
            'internal_process' => ['title' => 'Improve operational reliability', 'kpi' => 'Process compliance and incident rate', 'target' => '95% process compliance; reduce repeat incidents by 15%', 'evidence' => 'Audit and incident logs'],
            'learning_growth' => ['title' => 'Build role capability', 'kpi' => 'Training hours and competency sign-offs', 'target' => 'Complete mandatory training and one development goal', 'evidence' => 'HR learning management system'],
        ];
    }

    /**
     * @param  Collection<string, Perspective>  $perspectives
     * @param  array<string, mixed>  $goal
     */
    private function upsertGoal(Department $department, ?JobTitle $jobTitle, array $goal, $perspectives): void
    {
        $perspective = $perspectives->get($goal['perspective']);

        if (! $perspective) {
            return;
        }

        GoalLibraryItem::query()->updateOrCreate(
            [
                'department_id' => $department->id,
                'job_title_id' => $jobTitle?->id,
                'title' => $goal['title'],
            ],
            [
                'perspective_id' => $perspective->id,
                'description' => $goal['description'],
                'kpi_measure' => $goal['kpi_measure'],
                'target_definition' => $goal['target_definition'],
                'default_weight' => $goal['default_weight'],
                'evidence_source' => $goal['evidence_source'],
                'timeline_days' => $goal['timeline_days'],
                'is_active' => true,
            ],
        );
    }
}
