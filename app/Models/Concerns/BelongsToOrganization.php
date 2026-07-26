<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use App\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToOrganization
{
    public static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder): void {
            $organizationId = app(TenantContext::class)->id();

            if ($organizationId !== null) {
                $builder->where($builder->qualifyColumn('organization_id'), $organizationId);
            } else {
                $builder->whereRaw('1 = 0');
            }
        });

        static::creating(function ($model): void {
            if (! $model->getAttribute('organization_id')) {
                $organizationId = app(TenantContext::class)->id();

                if ($organizationId !== null) {
                    $model->setAttribute('organization_id', $organizationId);
                } elseif (! app()->environment(['local', 'testing'])) {
                    throw new \LogicException('Cannot create tenant-owned data without an active organization.');
                }
            }
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
