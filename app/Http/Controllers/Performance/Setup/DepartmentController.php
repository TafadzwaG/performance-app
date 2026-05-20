<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\Setup\StoreDepartmentRequest;
use App\Http\Requests\Performance\Setup\UpdateDepartmentRequest;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Department::class, 'department');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $departments = Department::query()
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/setup/departments/Index', [
            'departments' => $departments,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.setup.departments.create'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/setup/departments/Create');
    }

    public function store(StoreDepartmentRequest $request): RedirectResponse
    {
        Department::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return to_route('performance.setup.departments.index');
    }

    public function show(Department $department): Response
    {
        $department
            ->loadCount(['employeeProfiles', 'goalLibraryItems', 'appraisalTemplates'])
            ->load([
                'employeeProfiles' => fn ($query) => $query
                    ->with([
                        'user',
                        'jobTitle',
                        'latestAppraisal.reviewCycle',
                        'latestAppraisal.overallRatingLevel',
                        'latestAppraisal.calibratedOverallRatingLevel',
                    ])
                    ->orderBy('employee_number'),
            ]);

        return Inertia::render('performance/setup/departments/Show', [
            'department' => $department,
        ]);
    }

    public function edit(Department $department): Response
    {
        return Inertia::render('performance/setup/departments/Edit', [
            'department' => $department,
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): RedirectResponse
    {
        $department->update($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active'),
        ]);

        return to_route('performance.setup.departments.show', $department);
    }

    public function destroy(Department $department): RedirectResponse
    {
        $department->delete();

        return to_route('performance.setup.departments.index');
    }
}
