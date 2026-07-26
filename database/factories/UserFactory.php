<?php

namespace Database\Factories;

use App\Models\Location;
use App\Models\Organization;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    public function configure(): static
    {
        return $this->afterCreating(function (User $user): void {
            $organization = Organization::query()->first();

            if (! $organization) {
                return;
            }

            app(TenantContext::class)->set($organization);
            app(PermissionRegistrar::class)->setPermissionsTeamId($organization->id);

            $user->memberships()->updateOrCreate(
                ['organization_id' => $organization->id],
                [
                    'status' => $user->is_approved ? 'active' : 'invited',
                    'is_default' => true,
                    'access_all_locations' => true,
                    'invited_at' => now(),
                    'activated_at' => $user->is_approved ? now() : null,
                ],
            );

            $location = Location::withoutGlobalScopes()->where('organization_id', $organization->id)->first();
            if ($location) {
                $user->locations()->syncWithoutDetaching([$location->id]);
            }
        });
    }

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'is_approved' => true,
            'password' => static::$password ??= Hash::make('password'),
            'force_password_change' => false,
            'password_changed_at' => now(),
            'welcome_notification_sent_at' => null,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withEmailMfa(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_mfa_enabled' => true,
            'email_mfa_enabled_at' => now(),
        ]);
    }

    public function pendingApproval(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => false,
        ]);
    }
}
