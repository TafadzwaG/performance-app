<?php

namespace App\Tenancy;

use App\Models\Organization;

class TenantResolution
{
    public function __construct(
        public readonly Organization $organization,
        public readonly bool $supportAccess = false,
    ) {}
}
