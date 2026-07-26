<?php

namespace App\Services\Performance;

use App\Enums\RatingScaleType;
use App\Http\Controllers\OrganizationContextController;
use App\Models\AppraisalTemplate;
use App\Models\Competency;
use App\Models\Department;
use App\Models\JobTitle;
use App\Models\Organization;
use App\Models\Perspective;
use App\Models\RatingScale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AppraisalTemplateCloneService
{
    /** @var array<string, int> */
    private array $ratingScaleCache = [];

    /** @var array<string, int> */
    private array $perspectiveCache = [];

    /** @var array<string, int> */
    private array $competencyCache = [];

    public function userCanAccessOrganization(User $user, int $organizationId): bool
    {
        return OrganizationContextController::availableOrganizationsFor($user)
            ->contains(fn (Organization $organization) => $organization->id === $organizationId);
    }

    public function findSourceTemplate(int $organizationId, int $templateId): AppraisalTemplate
    {
        return AppraisalTemplate::withoutGlobalScopes()
            ->with([
                'items' => fn ($query) => $query->orderBy('sort_order'),
                'items.perspective' => fn ($query) => $query->withoutGlobalScopes(),
                'items.competency' => fn ($query) => $query->withoutGlobalScopes(),
                'objectiveRatingScale' => fn ($query) => $query->withoutGlobalScopes(),
                'objectiveRatingScale.levels' => fn ($query) => $query->orderBy('sort_order'),
                'competencyRatingScale' => fn ($query) => $query->withoutGlobalScopes(),
                'competencyRatingScale.levels' => fn ($query) => $query->orderBy('sort_order'),
                'overallRatingScale' => fn ($query) => $query->withoutGlobalScopes(),
                'overallRatingScale.levels' => fn ($query) => $query->orderBy('sort_order'),
                'department' => fn ($query) => $query->withoutGlobalScopes(),
                'jobTitle' => fn ($query) => $query->withoutGlobalScopes(),
            ])
            ->where('organization_id', $organizationId)
            ->findOrFail($templateId);
    }

    public function cloneToCurrentOrganization(AppraisalTemplate $source): AppraisalTemplate
    {
        $this->ratingScaleCache = [];
        $this->perspectiveCache = [];
        $this->competencyCache = [];

        return DB::transaction(function () use ($source) {
            $template = AppraisalTemplate::create([
                'name' => $this->uniqueName($source->name),
                'code' => $this->uniqueCode($source->code),
                'version' => $source->version,
                'description' => $source->description,
                'department_id' => $this->remapDepartment($source->department),
                'job_title_id' => $this->remapJobTitle($source->jobTitle),
                'objective_rating_scale_id' => $this->ensureRatingScale($source->objectiveRatingScale, RatingScaleType::Objective),
                'competency_rating_scale_id' => $this->ensureRatingScale($source->competencyRatingScale, RatingScaleType::Competency),
                'overall_rating_scale_id' => $this->ensureRatingScale($source->overallRatingScale, RatingScaleType::Overall),
                'business_weight_percent' => $source->business_weight_percent,
                'values_weight_percent' => $source->values_weight_percent,
                'min_objectives' => $source->min_objectives,
                'max_objectives' => $source->max_objectives,
                'allow_competencies' => $source->allow_competencies,
                'is_default' => false,
                'is_protected' => false,
                'is_active' => $source->is_active,
            ]);

            foreach ($source->items as $item) {
                $template->items()->create([
                    'item_type' => $item->item_type,
                    'perspective_id' => $item->perspective
                        ? $this->ensurePerspective($item->perspective)
                        : null,
                    'competency_id' => $item->competency
                        ? $this->ensureCompetency($item->competency)
                        : null,
                    'title' => $item->title,
                    'description' => $item->description,
                    'default_weight' => $item->default_weight,
                    'evidence_source_hint' => $item->evidence_source_hint,
                    'sort_order' => $item->sort_order,
                    'is_required' => $item->is_required,
                ]);
            }

            return $template->load('items');
        });
    }

    private function ensureRatingScale(?RatingScale $sourceScale, RatingScaleType $appliesTo): int
    {
        if (! $sourceScale) {
            throw ValidationException::withMessages([
                'template' => 'A required rating scale is missing from the source template.',
            ]);
        }

        $cacheKey = $appliesTo->value.':'.$sourceScale->code;

        if (isset($this->ratingScaleCache[$cacheKey])) {
            return $this->ratingScaleCache[$cacheKey];
        }

        if ($sourceScale->applies_to !== $appliesTo) {
            throw ValidationException::withMessages([
                'template' => "The shared rating scale [{$sourceScale->name}] has an incompatible type.",
            ]);
        }

        return $this->ratingScaleCache[$cacheKey] = $sourceScale->id;
    }

    private function ensurePerspective(Perspective $sourcePerspective): int
    {
        if (isset($this->perspectiveCache[$sourcePerspective->code])) {
            return $this->perspectiveCache[$sourcePerspective->code];
        }

        $existing = Perspective::query()->where('code', $sourcePerspective->code)->first();

        if ($existing) {
            return $this->perspectiveCache[$sourcePerspective->code] = $existing->id;
        }

        $created = Perspective::create([
            'name' => $sourcePerspective->name,
            'code' => $sourcePerspective->code,
            'description' => $sourcePerspective->description,
            'sort_order' => $sourcePerspective->sort_order,
            'is_active' => true,
        ]);

        return $this->perspectiveCache[$sourcePerspective->code] = $created->id;
    }

    private function ensureCompetency(Competency $sourceCompetency): int
    {
        if (isset($this->competencyCache[$sourceCompetency->code])) {
            return $this->competencyCache[$sourceCompetency->code];
        }

        $existing = Competency::query()->where('code', $sourceCompetency->code)->first();

        if ($existing) {
            return $this->competencyCache[$sourceCompetency->code] = $existing->id;
        }

        $created = Competency::create([
            'name' => $sourceCompetency->name,
            'code' => $sourceCompetency->code,
            'description' => $sourceCompetency->description,
            'category' => $sourceCompetency->category,
            'department_id' => null,
            'job_title_id' => null,
            'is_active' => true,
        ]);

        return $this->competencyCache[$sourceCompetency->code] = $created->id;
    }

    private function remapDepartment(?Department $sourceDepartment): ?int
    {
        if (! $sourceDepartment) {
            return null;
        }

        return Department::query()->where('code', $sourceDepartment->code)->value('id');
    }

    private function remapJobTitle(?JobTitle $sourceJobTitle): ?int
    {
        if (! $sourceJobTitle) {
            return null;
        }

        return JobTitle::query()->where('code', $sourceJobTitle->code)->value('id');
    }

    private function uniqueCode(string $code): string
    {
        $base = Str::slug($code) ?: 'imported-template';
        $candidate = $base;
        $suffix = 1;

        while (
            AppraisalTemplate::query()
                ->where('code', $candidate)
                ->where('version', 1)
                ->exists()
        ) {
            $candidate = "{$base}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    private function uniqueName(string $name): string
    {
        $base = trim($name);
        $candidate = "{$base} (Imported)";
        $suffix = 2;

        while (AppraisalTemplate::query()->where('name', $candidate)->exists()) {
            $candidate = "{$base} (Imported {$suffix})";
            $suffix++;
        }

        return $candidate;
    }
}
