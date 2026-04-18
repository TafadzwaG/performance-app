<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\UpdateEmployeeFieldSettingsRequest;
use App\Services\Performance\EmployeeFieldConfigService;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeFieldSettingsController extends Controller
{
    public function __construct(
        private readonly EmployeeFieldConfigService $configService,
    ) {
    }

    public function edit(): Response
    {
        abort_unless(request()->user()?->can('performance.employees.configure_fields'), 403);

        return Inertia::render('performance/setup/employee-fields/Edit', [
            'screens' => $this->configService->screensWithFields(),
        ]);
    }

    public function update(UpdateEmployeeFieldSettingsRequest $request)
    {
        foreach ($request->validated('screens') as $screen) {
            $this->configService->updateScreen($screen['key'], $screen['fields']);
        }

        return to_route('performance.setup.employee_fields.edit')
            ->with('success', 'Employee field settings updated successfully.');
    }
}
