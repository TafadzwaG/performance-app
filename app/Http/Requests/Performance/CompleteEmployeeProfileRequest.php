<?php

namespace App\Http\Requests\Performance;

use App\Models\EmployeeProfile;
use App\Support\Performance\EmployeeFieldRegistry;
use App\Support\Performance\EmployeeProfileFieldRules;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Http\FormRequest;

class CompleteEmployeeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $user = $this->user();
        $organizationId = app(TenantContext::class)->requireId();

        $existingProfile = EmployeeProfile::query()
            ->withoutGlobalScope('location_visibility')
            ->withTrashed()
            ->where('user_id', $user->id)
            ->where('organization_id', $organizationId)
            ->first();

        return EmployeeProfileFieldRules::make(
            EmployeeFieldRegistry::SCREEN_COMPLETE_PROFILE,
            $existingProfile,
            $user,
        );
    }
}
