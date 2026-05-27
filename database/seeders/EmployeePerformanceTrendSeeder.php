<?php

namespace Database\Seeders;

use App\Enums\AppraisalStatus;
use App\Enums\EmploymentStatus;
use App\Enums\PerformanceTrendStatus;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\ReviewCycle;
use App\Models\User;
use App\Services\Performance\EmployeePerformanceAnalyticsService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeePerformanceTrendSeeder extends Seeder
{
    /**
     * @return array<string, array{
     *     name: string,
     *     email: string,
     *     employee_number: string,
     *     trend: string,
     *     scores: array<string, float>,
     * }>
     */
    private function performanceProfiles(): array
    {
        return [
            'tatenda_dube' => [
                'name' => 'Tatenda Dube',
                'email' => 'tatenda.dube@nhaka.test',
                'employee_number' => 'CX-001',
                'trend' => PerformanceTrendStatus::Improving->label(),
                'scores' => [
                    'fy2024' => 68.0,
                    'fy2025' => 74.0,
                    'fy2026' => 83.0,
                ],
            ],
            'rumbidzai_ncube' => [
                'name' => 'Rumbidzai Ncube',
                'email' => 'rumbidzai.ncube@nhaka.test',
                'employee_number' => 'FIN-011',
                'trend' => PerformanceTrendStatus::Declining->label(),
                'scores' => [
                    'fy2024' => 86.0,
                    'fy2025' => 79.0,
                    'fy2026' => 72.0,
                ],
            ],
            'farai_muchengeti' => [
                'name' => 'Farai Muchengeti',
                'email' => 'farai.muchengeti@nhaka.test',
                'employee_number' => 'DIG-014',
                'trend' => PerformanceTrendStatus::Stable->label(),
                'scores' => [
                    'fy2024' => 76.0,
                    'fy2025' => 76.0,
                    'fy2026' => 76.0,
                ],
            ],
        ];
    }

    /**
     * @return array<string, array{name: string, email: string, employee_number: string, score: float}>
     */
    private function peerProfiles(): array
    {
        return [
            'chiedza_nyoni' => [
                'name' => 'Chiedza Nyoni',
                'email' => 'chiedza.nyoni@nhaka.test',
                'employee_number' => 'CMB-006',
                'score' => 78.0,
            ],
            'tinashe_bhebhe' => [
                'name' => 'Tinashe Bhebhe',
                'email' => 'tinashe.bhebhe@nhaka.test',
                'employee_number' => 'OPS-015',
                'score' => 81.0,
            ],
        ];
    }

    public function run(): void
    {
        DB::transaction(function () {
            $template = AppraisalTemplate::query()
                ->where('code', 'monomotapa-performance-appraisal')
                ->where('version', 1)
                ->firstOrFail();

            $cycles = $this->seedCycles();
            $profiles = [];

            foreach ($this->performanceProfiles() as $key => $config) {
                $profiles[$key] = $this->resolveEmployeeProfile($key, $config);

                foreach ($config['scores'] as $cycleKey => $score) {
                    $this->seedFinalizedAppraisal(
                        profile: $profiles[$key],
                        cycle: $cycles[$cycleKey],
                        template: $template,
                        overallScore: $score,
                    );
                }
            }

            foreach ($this->peerProfiles() as $key => $config) {
                $profile = $this->resolveEmployeeProfile($key, $config);
                $this->seedFinalizedAppraisal(
                    profile: $profile,
                    cycle: $cycles['fy2026'],
                    template: $template,
                    overallScore: $config['score'],
                );
            }

            $this->assertTrends($profiles, $cycles['fy2026']);
        });

        $this->command?->info('Seeded 3-cycle performance history for Tatenda Dube, Rumbidzai Ncube, and Farai Muchengeti.');
    }

    /**
     * @return array<string, ReviewCycle>
     */
    private function seedCycles(): array
    {
        return [
            'fy2024' => ReviewCycle::query()->updateOrCreate(
                ['code' => 'FY2024-ANNUAL'],
                [
                    'name' => '2024 Annual Performance Review',
                    'description' => 'Historical cycle used to simulate three-year employee performance trends.',
                    'start_date' => '2024-01-01',
                    'end_date' => '2024-12-31',
                    'goal_setting_deadline' => '2024-02-15',
                    'self_assessment_deadline' => '2024-08-31',
                    'manager_review_deadline' => '2024-09-30',
                    'approval_deadline' => '2024-10-15',
                    'status' => ReviewCycleStatus::Closed->value,
                    'opened_at' => '2024-01-05 08:00:00',
                    'closed_at' => '2024-11-15 17:30:00',
                ],
            ),
            'fy2025' => ReviewCycle::query()->updateOrCreate(
                ['code' => 'FY2025-ANNUAL'],
                [
                    'name' => '2025 Annual Performance Review',
                    'description' => 'Middle cycle in the three-year employee performance trend simulation.',
                    'start_date' => '2025-01-01',
                    'end_date' => '2025-12-31',
                    'goal_setting_deadline' => '2025-02-15',
                    'self_assessment_deadline' => '2025-08-31',
                    'manager_review_deadline' => '2025-09-30',
                    'approval_deadline' => '2025-10-15',
                    'status' => ReviewCycleStatus::Closed->value,
                    'opened_at' => '2025-01-03 08:00:00',
                    'closed_at' => '2025-11-15 17:30:00',
                ],
            ),
            'fy2026' => ReviewCycle::query()->updateOrCreate(
                ['code' => 'FY2026-ANNUAL'],
                [
                    'name' => '2026 Annual Performance Review',
                    'description' => 'Current cycle used for latest performance trend and peer comparison demos.',
                    'start_date' => '2026-01-01',
                    'end_date' => '2026-12-31',
                    'goal_setting_deadline' => '2026-02-15',
                    'self_assessment_deadline' => '2026-08-31',
                    'manager_review_deadline' => '2026-09-30',
                    'approval_deadline' => '2026-10-15',
                    'status' => ReviewCycleStatus::Open->value,
                    'opened_at' => '2026-01-05 08:00:00',
                    'closed_at' => null,
                ],
            ),
        ];
    }

    /**
     * @param  array{name: string, email: string, employee_number: string}  $config
     */
    private function resolveEmployeeProfile(string $key, array $config): EmployeeProfile
    {
        $user = User::query()->firstOrCreate(
            ['email' => $config['email']],
            [
                'name' => $config['name'],
                'password' => bcrypt('password'),
                'is_approved' => true,
            ],
        );

        if (! $user->hasRole('Employee')) {
            $user->assignRole('Employee');
        }

        $department = Department::query()->firstOrCreate(
            ['code' => 'PERF-TREND'],
            ['name' => 'Performance Analytics Demo', 'is_active' => true],
        );
        $jobTitle = JobTitle::query()->firstOrCreate(
            ['code' => 'PERF-ANALYST'],
            ['name' => 'Performance Analyst', 'is_active' => true],
        );

        return EmployeeProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'employee_number' => $config['employee_number'],
                'department_id' => $department->id,
                'job_title_id' => $jobTitle->id,
                'employment_status' => EmploymentStatus::Active,
                'employment_type' => 'permanent',
                'hire_date' => '2022-01-10',
                'is_review_eligible' => true,
                'is_active' => true,
            ],
        );
    }

    private function seedFinalizedAppraisal(
        EmployeeProfile $profile,
        ReviewCycle $cycle,
        AppraisalTemplate $template,
        float $overallScore,
    ): Appraisal {
        $profile->loadMissing(['user', 'department', 'jobTitle']);

        $businessScore = round($overallScore * 0.8, 1);
        $valuesScore = round($overallScore * 0.2, 1);
        $finalizedAt = $cycle->end_date?->copy()->setTime(16, 0, 0) ?? now();

        return Appraisal::query()->updateOrCreate(
            [
                'review_cycle_id' => $cycle->id,
                'employee_profile_id' => $profile->id,
            ],
            [
                'template_id' => $template->id,
                'employee_user_id' => $profile->user_id,
                'line_manager_user_id' => $profile->line_manager_user_id,
                'approving_manager_user_id' => $profile->approving_manager_user_id,
                'status' => AppraisalStatus::Finalized,
                'business_weight_percent' => $template->business_weight_percent ?? 80,
                'values_weight_percent' => $template->values_weight_percent ?? 20,
                'business_score' => $businessScore,
                'values_score' => $valuesScore,
                'overall_score' => $overallScore,
                'calibrated_overall_score' => null,
                'approved_at' => $finalizedAt->copy()->subDays(7),
                'finalized_at' => $finalizedAt,
                'employee_name_snapshot' => $profile->user?->name,
                'employee_email_snapshot' => $profile->user?->email,
                'employee_number_snapshot' => $profile->employee_number,
                'department_name_snapshot' => $profile->department?->name,
                'job_title_name_snapshot' => $profile->jobTitle?->name,
                'cycle_name_snapshot' => $cycle->name,
                'template_name_snapshot' => $template->name,
            ],
        );
    }

    /**
     * @param  array<string, EmployeeProfile>  $profiles
     */
    private function assertTrends(array $profiles, ReviewCycle $currentCycle): void
    {
        $service = app(EmployeePerformanceAnalyticsService::class);

        $tatendaTrend = $service->employeeTrend($profiles['tatenda_dube']->id, [
            'review_cycle_id' => $currentCycle->id,
        ]);
        $rumbidzaiTrend = $service->employeeTrend($profiles['rumbidzai_ncube']->id, [
            'review_cycle_id' => $currentCycle->id,
        ]);
        $faraiTrend = $service->employeeTrend($profiles['farai_muchengeti']->id, [
            'review_cycle_id' => $currentCycle->id,
        ]);

        abort_unless(
            count($tatendaTrend['points']) === 3
            && $tatendaTrend['trend_status'] === PerformanceTrendStatus::Improving->value,
            500,
            'Tatenda Dube trend seed failed.',
        );

        abort_unless(
            count($rumbidzaiTrend['points']) === 3
            && $rumbidzaiTrend['trend_status'] === PerformanceTrendStatus::Declining->value,
            500,
            'Rumbidzai Ncube trend seed failed.',
        );

        abort_unless(
            count($faraiTrend['points']) === 3
            && $faraiTrend['trend_status'] === PerformanceTrendStatus::Stable->value,
            500,
            'Farai Muchengeti trend seed failed.',
        );
    }
}
