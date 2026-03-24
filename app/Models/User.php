<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Lab404\Impersonate\Models\Impersonate;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable, Impersonate;

    protected string $guard_name = 'web';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'force_password_change',
        'password_changed_at',
        'welcome_notification_sent_at',
        'email_verified_at',
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
            'password' => 'hashed',
            'force_password_change' => 'boolean',
            'password_changed_at' => 'datetime',
            'welcome_notification_sent_at' => 'datetime',
        ];
    }

    public function employeeProfile(): HasOne
    {
        return $this->hasOne(EmployeeProfile::class);
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
        return true;
    }
}
