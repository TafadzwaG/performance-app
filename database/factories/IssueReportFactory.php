<?php

namespace Database\Factories;

use App\Enums\IssueStatus;
use App\Enums\IssueType;
use App\Models\IssueReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IssueReport>
 */
class IssueReportFactory extends Factory
{
    protected $model = IssueReport::class;

    public function definition(): array
    {
        return [
            'reporter_user_id' => User::factory(),
            'assignee_user_id' => null,
            'type' => fake()->randomElement(IssueType::cases()),
            'title' => fake()->sentence(6),
            'description' => fake()->paragraph(),
            'status' => IssueStatus::Pending,
        ];
    }

    public function assigned(?User $assignee = null): static
    {
        return $this->state(fn () => [
            'assignee_user_id' => $assignee?->id ?? User::factory(),
            'status' => IssueStatus::InProgress,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => IssueStatus::Completed,
        ]);
    }
}
