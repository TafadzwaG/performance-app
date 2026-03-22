<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\Setup\StoreRatingScaleRequest;
use App\Http\Requests\Performance\Setup\UpdateRatingScaleRequest;
use App\Models\RatingScale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RatingScaleController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(RatingScale::class, 'rating_scale');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $ratingScales = RatingScale::query()
            ->with('levels')
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/setup/rating-scales/Index', [
            'ratingScales' => $ratingScales,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.setup.rating_scales.create'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/setup/rating-scales/Create');
    }

    public function store(StoreRatingScaleRequest $request): RedirectResponse
    {
        $ratingScale = DB::transaction(function () use ($request) {
            $ratingScale = RatingScale::create($request->safe()->except('levels') + [
                'is_active' => (bool) $request->boolean('is_active', true),
            ]);

            $this->syncLevels($ratingScale, $request->validated('levels', []));

            return $ratingScale;
        });

        return to_route('performance.setup.rating_scales.show', $ratingScale);
    }

    public function show(RatingScale $ratingScale): Response
    {
        $ratingScale->load('levels');

        return Inertia::render('performance/setup/rating-scales/Show', [
            'ratingScale' => $ratingScale,
        ]);
    }

    public function edit(RatingScale $ratingScale): Response
    {
        $ratingScale->load('levels');

        return Inertia::render('performance/setup/rating-scales/Edit', [
            'ratingScale' => $ratingScale,
        ]);
    }

    public function update(UpdateRatingScaleRequest $request, RatingScale $ratingScale): RedirectResponse
    {
        DB::transaction(function () use ($request, $ratingScale) {
            $ratingScale->update($request->safe()->except('levels') + [
                'is_active' => (bool) $request->boolean('is_active'),
            ]);

            $ratingScale->levels()->delete();
            $this->syncLevels($ratingScale, $request->validated('levels', []));
        });

        return to_route('performance.setup.rating_scales.show', $ratingScale);
    }

    public function destroy(RatingScale $ratingScale): RedirectResponse
    {
        $ratingScale->delete();

        return to_route('performance.setup.rating_scales.index');
    }

    private function syncLevels(RatingScale $ratingScale, array $levels): void
    {
        foreach ($levels as $level) {
            $ratingScale->levels()->create([
                'label' => $level['label'],
                'short_label' => $level['short_label'] ?? null,
                'value' => $level['value'],
                'min_percent' => $level['min_percent'] ?? null,
                'max_percent' => $level['max_percent'] ?? null,
                'color' => $level['color'] ?? null,
                'sort_order' => $level['sort_order'],
                'is_default' => (bool) ($level['is_default'] ?? false),
            ]);
        }
    }
}
