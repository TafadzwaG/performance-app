<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Location::class, 'location');
    }

    public function index(Request $request): Response
    {
        return Inertia::render('performance/setup/locations/Index', [
            'locations' => Location::query()
                ->withCount(['employeeProfiles', 'users'])
                ->orderBy('name')
                ->get(),
            'can' => [
                'create' => $request->user()->can('create', Location::class),
                'update' => $request->user()->can('performance.setup.locations.update'),
                'archive' => $request->user()->can('performance.setup.locations.archive'),
            ],
        ]);
    }

    public function store(Request $request, TenantContext $context): RedirectResponse
    {
        $validated = $this->validateLocation($request, $context);
        Location::query()->create($validated + ['is_active' => true]);

        return back()->with('success', 'Location created.');
    }

    public function update(Request $request, Location $location, TenantContext $context): RedirectResponse
    {
        $location->update($this->validateLocation($request, $context, $location));

        return back()->with('success', 'Location updated.');
    }

    public function destroy(Location $location): RedirectResponse
    {
        abort_if($location->employeeProfiles()->exists(), 422, 'Move employees before archiving this location.');
        $location->update(['is_active' => false]);

        return back()->with('success', 'Location archived.');
    }

    private function validateLocation(Request $request, TenantContext $context, ?Location $location = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('locations', 'name')->where('organization_id', $context->requireId())->ignore($location?->id)],
            'code' => ['required', 'alpha_dash', 'max:50', Rule::unique('locations', 'code')->where('organization_id', $context->requireId())->ignore($location?->id)],
            'timezone' => ['nullable', 'timezone'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
