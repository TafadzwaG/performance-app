<?php

namespace App\Models;

use App\Enums\AppraisalStatus;
use App\Enums\WorkflowStage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Appraisal extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'review_cycle_id',
        'employee_profile_id',
        'template_id',
        'employee_user_id',
        'line_manager_user_id',
        'approving_manager_user_id',
        'status',
        'reopened_stage',
        'business_weight_percent',
        'values_weight_percent',
        'business_score',
        'values_score',
        'overall_score',
        'calibrated_overall_score',
        'overall_rating_scale_level_id',
        'calibrated_overall_rating_scale_level_id',
        'goal_submitted_at',
        'self_assessment_submitted_at',
        'manager_reviewed_at',
        'approved_at',
        'calibration_comment',
        'calibrated_at',
        'calibrated_by_user_id',
        'finalized_at',
        'employee_name_snapshot',
        'employee_email_snapshot',
        'employee_number_snapshot',
        'department_name_snapshot',
        'job_title_name_snapshot',
        'cycle_name_snapshot',
        'template_name_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'status' => AppraisalStatus::class,
            'reopened_stage' => WorkflowStage::class,
            'goal_submitted_at' => 'datetime',
            'self_assessment_submitted_at' => 'datetime',
            'manager_reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'calibrated_at' => 'datetime',
            'finalized_at' => 'datetime',
            'business_score' => 'decimal:2',
            'values_score' => 'decimal:2',
            'overall_score' => 'decimal:2',
            'calibrated_overall_score' => 'decimal:2',
        ];
    }

    public function reviewCycle(): BelongsTo
    {
        return $this->belongsTo(ReviewCycle::class);
    }

    public function employeeProfile(): BelongsTo
    {
        return $this->belongsTo(EmployeeProfile::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(AppraisalTemplate::class, 'template_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_user_id');
    }

    public function lineManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'line_manager_user_id');
    }

    public function approvingManager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approving_manager_user_id');
    }

    public function overallRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'overall_rating_scale_level_id');
    }

    public function calibratedOverallRatingLevel(): BelongsTo
    {
        return $this->belongsTo(RatingScaleLevel::class, 'calibrated_overall_rating_scale_level_id');
    }

    public function calibratedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'calibrated_by_user_id');
    }

    public function objectives(): HasMany
    {
        return $this->hasMany(AppraisalObjective::class)->orderBy('sort_order');
    }

    public function competencyRatings(): HasMany
    {
        return $this->hasMany(AppraisalCompetencyRating::class)->orderBy('sort_order');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(AppraisalComment::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(AppraisalApproval::class)->latest('acted_at');
    }

    public function calibrations(): HasMany
    {
        return $this->hasMany(AppraisalCalibration::class)->latest();
    }

    public function latestCalibration(): HasOne
    {
        return $this->hasOne(AppraisalCalibration::class)->latestOfMany();
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(AppraisalStatusHistory::class)->latest('changed_at');
    }

    public function developmentPlan(): HasOne
    {
        return $this->hasOne(DevelopmentPlan::class);
    }
}
