<?php

namespace App\Tenancy;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Collection;
use RuntimeException;

class TenantContext
{
    private ?Organization $organization = null;

    private bool $supportAccess = false;

    /** @var array<int, Collection<int, int>|null> */
    private array $locationCache = [];

    public function set(Organization $organization, bool $supportAccess = false): void
    {
        $this->organization = $organization;
        $this->supportAccess = $supportAccess;
        $this->locationCache = [];
    }

    public function clear(): void
    {
        $this->organization = null;
        $this->supportAccess = false;
        $this->locationCache = [];
    }

    public function organization(): ?Organization
    {
        return $this->organization;
    }

    public function id(): ?int
    {
        return $this->organization?->getKey();
    }

    public function requireId(): int
    {
        return $this->id() ?? throw new RuntimeException('An active organization is required for this operation.');
    }

    public function isSupportAccess(): bool
    {
        return $this->supportAccess;
    }

    /**
     * Null means every active location in the current organization is allowed.
     *
     * @return Collection<int, int>|null
     */
    public function allowedLocationIds(User $user): ?Collection
    {
        if (array_key_exists($user->id, $this->locationCache)) {
            return $this->locationCache[$user->id];
        }

        $membership = $user->memberships()
            ->where('organization_id', $this->requireId())
            ->where('status', 'active')
            ->first();

        if ($this->supportAccess || $membership?->access_all_locations) {
            return $this->locationCache[$user->id] = null;
        }

        return $this->locationCache[$user->id] = $user->locations()
            ->where('locations.organization_id', $this->requireId())
            ->where('locations.is_active', true)
            ->pluck('locations.id');
    }
}
