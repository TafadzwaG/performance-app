<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\Auth\ResetPasswordNotification;
use App\Tenancy\TenantContext;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Lab404\Impersonate\Models\Impersonate;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Impersonate, Notifiable;

    protected string $guard_name = 'web';

    protected static function booted(): void
    {
        static::addGlobalScope('organization_membership', function (Builder $builder): void {
            $organizationId = app(TenantContext::class)->id();

            if ($organizationId !== null) {
                $builder->whereHas('memberships', fn (Builder $query) => $query->where('organization_id', $organizationId));
            }
        });
    }

    /**
     * Send the password reset notification.
     */
    public function sendPasswordResetNotification(#[\SensitiveParameter] $token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'is_approved',
        'is_platform_admin',
        'password',
        'force_password_change',
        'password_changed_at',
        'welcome_notification_sent_at',
        'email_verified_at',
        'email_mfa_enabled',
        'email_mfa_enabled_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_approved' => 'boolean',
            'is_platform_admin' => 'boolean',
            'password' => 'hashed',
            'force_password_change' => 'boolean',
            'password_changed_at' => 'datetime',
            'welcome_notification_sent_at' => 'datetime',
            'email_mfa_enabled' => 'boolean',
            'email_mfa_enabled_at' => 'datetime',
        ];
    }

    public function hasEmailMfaEnabled(): bool
    {
        return (bool) $this->email_mfa_enabled;
    }

    public function employeeProfile(): HasOne
    {
        $relation = $this->hasOne(EmployeeProfile::class);
        $organizationId = app(TenantContext::class)->id();

        return $organizationId ? $relation->where('organization_id', $organizationId) : $relation;
    }

    public function employeeProfiles(): HasMany
    {
        return $this->hasMany(EmployeeProfile::class);
    }

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_memberships')
            ->withPivot(['status', 'is_default', 'access_all_locations'])
            ->withTimestamps();
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(OrganizationMembership::class);
    }

    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class)->withTimestamps();
    }

    public function notifications(): MorphMany
    {
        return $this->morphMany(TenantDatabaseNotification::class, 'notifiable')->latest();
    }

    public function managedEmployeeProfiles(): HasMany
    {
        return $this->hasMany(EmployeeProfile::class, 'line_manager_user_id');
    }

    public function approvingEmployeeProfiles(): HasMany
    {
        return $this->hasMany(EmployeeProfile::class, 'approving_manager_user_id');
    }

    public function appraisalComments(): HasMany
    {
        return $this->hasMany(AppraisalComment::class, 'author_user_id');
    }

    public function appraisalApprovals(): HasMany
    {
        return $this->hasMany(AppraisalApproval::class, 'actor_user_id');
    }

    public function auditTrails(): HasMany
    {
        return $this->hasMany(AuditTrail::class);
    }

    public function impersonatedAuditTrails(): HasMany
    {
        return $this->hasMany(AuditTrail::class, 'impersonator_user_id');
    }

    public function canImpersonate(): bool
    {
        return $this->can('access.users.impersonate');
    }

    public function canBeImpersonated(): bool
    {
        if (! $this->is_approved) {
            return false;
        }

        if ($this->can('access.users.impersonate')) {
            return false;
        }

        if ($this->hasRole('Super Admin')) {
            return false;
        }

        return true;
    }
}
