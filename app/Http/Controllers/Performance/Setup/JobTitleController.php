<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\Setup\StoreJobTitleRequest;
use App\Http\Requests\Performance\Setup\UpdateJobTitleRequest;
use App\Models\JobTitle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobTitleController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(JobTitle::class, 'job_title');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $jobTitles = JobTitle::query()
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/setup/job-titles/Index', [
            'jobTitles' => $jobTitles,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.setup.job_titles.create'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/setup/job-titles/Create');
    }

    public function store(StoreJobTitleRequest $request): RedirectResponse
    {
        JobTitle::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return to_route('performance.setup.job_titles.index');
    }

    public function show(JobTitle $jobTitle): Response
    {
        $jobTitle->loadCount(['employeeProfiles', 'goalLibraryItems', 'appraisalTemplates']);

        return Inertia::render('performance/setup/job-titles/Show', [
            'jobTitle' => $jobTitle,
        ]);
    }

    public function edit(JobTitle $jobTitle): Response
    {
        return Inertia::render('performance/setup/job-titles/Edit', [
            'jobTitle' => $jobTitle,
        ]);
    }

    public function update(UpdateJobTitleRequest $request, JobTitle $jobTitle): RedirectResponse
    {
        $jobTitle->update($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active'),
        ]);

        return to_route('performance.setup.job_titles.show', $jobTitle);
    }

    public function destroy(JobTitle $jobTitle): RedirectResponse
    {
        $jobTitle->delete();

        return to_route('performance.setup.job_titles.index');
    }
}
