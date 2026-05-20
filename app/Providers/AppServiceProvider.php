<?php

namespace App\Providers;

use App\Events\Performance\AppraisalStatusChanged;
use App\Listeners\Performance\InvalidateDashboardCache;
use App\Listeners\Performance\SendAppraisalWorkflowNotifications;
use App\Models\Appraisal;
use App\Models\AppraisalTemplate;
use App\Models\Competency;
use App\Models\Department;
use App\Models\DevelopmentPlan;
use App\Models\EmployeeProfile;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Perspective;
use App\Models\RatingScale;
use App\Models\ReviewCycle;
use App\Models\Role;
use App\Models\User;
use App\Policies\AppraisalPolicy;
use App\Policies\AppraisalTemplatePolicy;
use App\Policies\CompetencyPolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\DevelopmentPlanPolicy;
use App\Policies\EmployeeProfilePolicy;
use App\Policies\GoalLibraryItemPolicy;
use App\Policies\JobTitlePolicy;
use App\Policies\PerspectivePolicy;
use App\Policies\RatingScalePolicy;
use App\Policies\ReviewCyclePolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use App\Services\Settings\MailSettingsService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Department::class, DepartmentPolicy::class);
        Gate::policy(JobTitle::class, JobTitlePolicy::class);
        Gate::policy(Perspective::class, PerspectivePolicy::class);
        Gate::policy(Competency::class, CompetencyPolicy::class);
        Gate::policy(RatingScale::class, RatingScalePolicy::class);
        Gate::policy(AppraisalTemplate::class, AppraisalTemplatePolicy::class);
        Gate::policy(GoalLibraryItem::class, GoalLibraryItemPolicy::class);
        Gate::policy(EmployeeProfile::class, EmployeeProfilePolicy::class);
        Gate::policy(ReviewCycle::class, ReviewCyclePolicy::class);
        Gate::policy(Appraisal::class, AppraisalPolicy::class);
        Gate::policy(DevelopmentPlan::class, DevelopmentPlanPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        Event::listen(
            AppraisalStatusChanged::class,
            SendAppraisalWorkflowNotifications::class,
        );

        Event::listen(
            AppraisalStatusChanged::class,
            InvalidateDashboardCache::class,
        );

        app(MailSettingsService::class)->apply();
    }
}
