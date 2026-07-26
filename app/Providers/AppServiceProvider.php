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
use App\Models\IssueReport;
use App\Models\JobTitle;
use App\Models\Location;
use App\Models\Perspective;
use App\Models\RatingScale;
use App\Models\ReviewCycle;
use App\Models\Role;
use App\Models\User;
use App\Observers\EmployeeProfileObserver;
use App\Policies\AppraisalPolicy;
use App\Policies\AppraisalTemplatePolicy;
use App\Policies\CompetencyPolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\DevelopmentPlanPolicy;
use App\Policies\EmployeeProfilePolicy;
use App\Policies\GoalLibraryItemPolicy;
use App\Policies\IssueReportPolicy;
use App\Policies\JobTitlePolicy;
use App\Policies\LocationPolicy;
use App\Policies\PerspectivePolicy;
use App\Policies\RatingScalePolicy;
use App\Policies\ReviewCyclePolicy;
use App\Policies\RolePolicy;
use App\Policies\UserPolicy;
use App\Services\Settings\MailSettingsService;
use App\Tenancy\TenantContext;
use App\Tenancy\TenantModelRegistry;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(TenantContext::class, fn () => new TenantContext);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        app(TenantModelRegistry::class)->boot();
        EmployeeProfile::observe(EmployeeProfileObserver::class);
        $this->configureRateLimiting();

        Password::defaults(function () {
            return Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols();
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            return url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));
        });

        Gate::policy(Department::class, DepartmentPolicy::class);
        Gate::policy(IssueReport::class, IssueReportPolicy::class);
        Gate::policy(JobTitle::class, JobTitlePolicy::class);
        Gate::policy(Location::class, LocationPolicy::class);
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

        Gate::before(function (User $user): ?bool {
            $context = app(TenantContext::class);

            return $user->is_platform_admin && $context->isSupportAccess() ? true : null;
        });

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

    private function configureRateLimiting(): void
    {
        RateLimiter::for('auth.login', function (Request $request): array {
            return $this->accountAndIpLimits(
                $request,
                'login',
                $this->requestIdentity($request, 'email'),
                (int) config('rate_limits.authentication.login_per_account'),
                (int) config('rate_limits.authentication.login_per_ip'),
            );
        });

        RateLimiter::for('auth.mfa.verify', function (Request $request): array {
            return $this->accountAndIpLimits(
                $request,
                'mfa-verify',
                (string) $request->session()->get('login.id', 'missing'),
                (int) config('rate_limits.authentication.mfa_verify_per_account'),
                (int) config('rate_limits.authentication.mfa_verify_per_ip'),
            );
        });

        RateLimiter::for('auth.mfa.resend', function (Request $request): array {
            return $this->accountAndIpLimits(
                $request,
                'mfa-resend',
                (string) $request->session()->get('login.id', 'missing'),
                (int) config('rate_limits.authentication.mfa_resend_per_account'),
                (int) config('rate_limits.authentication.mfa_resend_per_ip'),
            );
        });

        RateLimiter::for('auth.password', function (Request $request): array {
            return $this->accountAndIpLimits(
                $request,
                'password',
                $this->requestIdentity($request, 'email'),
                (int) config('rate_limits.authentication.password_per_account'),
                (int) config('rate_limits.authentication.password_per_ip'),
            );
        });

        RateLimiter::for('auth.verification', function (Request $request): array {
            $identity = (string) ($request->user()?->getAuthIdentifier() ?? $request->route('id') ?? 'missing');

            return $this->accountAndIpLimits(
                $request,
                'verification',
                $identity,
                (int) config('rate_limits.authentication.verification_per_account'),
                (int) config('rate_limits.authentication.verification_per_ip'),
            );
        });
    }

    /** @return list<Limit> */
    private function accountAndIpLimits(
        Request $request,
        string $scope,
        string $identity,
        int $perAccount,
        int $perIp,
    ): array {
        $ip = $request->ip() ?: 'unknown';
        $identityHash = hash('sha256', Str::lower(trim($identity)));

        return [
            Limit::perMinute(max(1, $perAccount))->by("auth:{$scope}:account:{$identityHash}"),
            Limit::perMinute(max(1, $perIp))->by("auth:{$scope}:ip:{$ip}"),
        ];
    }

    private function requestIdentity(Request $request, string $field): string
    {
        $value = $request->input($field);

        return is_scalar($value) ? (string) $value : 'missing';
    }
}
