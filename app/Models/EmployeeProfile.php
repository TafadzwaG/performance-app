<?php

namespace App\Models;

use App\Enums\EmploymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'employee_number',
        'national_id',
        'date_of_birth',
        'gender',
        'marital_status',
        'personal_phone',
        'home_address_line_1',
        'home_address_line_2',
        'city',
        'state_province',
        'postal_code',
        'country',
        'emergency_contact_name',
        'emergency_contact_phone',
        'department_id',
        'job_title_id',
        'line_manager_user_id',
        'approving_manager_user_id',
        'employment_status',
        'employment_type',
        'work_location',
        'hire_date',
        'probation_end_date',
        'confirmation_date',
        'is_review_eligible',
        'review_eligibility_date',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'employment_status' => EmploymentStatus::class,
            'date_of_birth' => 'date',
            'hire_date' => 'date',
            'probation_end_date' => 'date',
            'confirmation_date' => 'date',
            'review_eligibility_date' => 'date',
            'is_review_eligible' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function jobTitle(): BelongsTo
    {
        return $this->belongsTo(JobTitle::class);
    }

    public function lineManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'line_manager_user_id');
    }

    public function approvingManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approving_manager_user_id');
    }

    public function appraisals(): HasMany
    {
        return $this->hasMany(Appraisal::class);
    }
}
