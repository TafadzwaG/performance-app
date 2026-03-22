<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Http\Requests\Performance\Setup\StoreCompetencyRequest;
use App\Http\Requests\Performance\Setup\UpdateCompetencyRequest;
use App\Models\Competency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompetencyController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct()
    {
        $this->authorizeResource(Competency::class, 'competency');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $competencies = Competency::query()
            ->with(['department', 'jobTitle'])
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/setup/competencies/Index', [
            'competencies' => $competencies,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.setup.competencies.create'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/setup/competencies/Create', [
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
        ]);
    }

    public function store(StoreCompetencyRequest $request): RedirectResponse
    {
        Competency::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return to_route('performance.setup.competencies.index');
    }

    public function show(Competency $competency): Response
    {
        $competency->load(['department', 'jobTitle'])->loadCount('appraisalCompetencyRatings');

        return Inertia::render('performance/setup/competencies/Show', [
            'competency' => $competency,
        ]);
    }

    public function edit(Competency $competency): Response
    {
        $competency->load(['department', 'jobTitle']);

        return Inertia::render('performance/setup/competencies/Edit', [
            'competency' => $competency,
            'departmentOptions' => $this->departmentOptions(),
            'jobTitleOptions' => $this->jobTitleOptions(),
        ]);
    }

    public function update(UpdateCompetencyRequest $request, Competency $competency): RedirectResponse
    {
        $competency->update($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active'),
        ]);

        return to_route('performance.setup.competencies.show', $competency);
    }

    public function destroy(Competency $competency): RedirectResponse
    {
        $competency->delete();

        return to_route('performance.setup.competencies.index');
    }
}
