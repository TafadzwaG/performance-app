<?php

use App\Enums\AppraisalStatus;
use App\Enums\ReviewCycleStatus;
use App\Models\Appraisal;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\ReviewCycle;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

test('database seeder creates zimbabwean performance demo data', function () {
    $this->seed(DatabaseSeeder::class);

    $rutendo = User::query()->where('email', 'rutendo.moyo@nhaka.test')->first();
    $tatenda = User::query()->where('email', 'tatenda.dube@nhaka.test')->first();

    expect($rutendo)->not()->toBeNull();
    expect($rutendo->name)->toBe('Rutendo Moyo');
    expect($rutendo->hasRole('Super Admin'))->toBeTrue();

    expect($tatenda)->not()->toBeNull();
    expect($tatenda->hasRole('Employee'))->toBeTrue();

    $this->assertDatabaseHas('departments', ['code' => 'OPS', 'name' => 'Operations']);
    $this->assertDatabaseHas('job_titles', ['code' => 'ROM', 'name' => 'Retail Operations Manager']);
    $this->assertDatabaseHas('employee_profiles', [
        'employee_number' => 'CX-001',
        'national_id' => '14-771245-D-61',
        'city' => 'Harare',
        'country' => 'Zimbabwe',
    ]);
    $this->assertDatabaseHas('goal_library_items', ['title' => 'Grow the SME lending portfolio in Mutare']);
    $this->assertDatabaseHas('review_cycles', ['code' => 'FY2026-ANNUAL', 'status' => ReviewCycleStatus::Open->value]);

    expect(Department::query()->count())->toBeGreaterThanOrEqual(6);
    expect(EmployeeProfile::query()->count())->toBeGreaterThanOrEqual(12);
    expect(ReviewCycle::query()->count())->toBeGreaterThanOrEqual(3);
    expect(Appraisal::query()->where('status', AppraisalStatus::Finalized->value)->count())->toBeGreaterThanOrEqual(4);
    expect(Appraisal::query()->where('status', AppraisalStatus::SentBack->value)->exists())->toBeTrue();
});
