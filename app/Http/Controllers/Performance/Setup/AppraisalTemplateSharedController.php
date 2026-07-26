<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Controllers\OrganizationContextController;
use App\Http\Controllers\Performance\Concerns\BuildsPerformanceViewData;
use App\Models\AppraisalTemplate;
use App\Models\Organization;
use App\Services\Performance\AppraisalTemplateCloneService;
use App\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppraisalTemplateSharedController extends Controller
{
    use BuildsPerformanceViewData;

    public function __construct(
        private readonly AppraisalTemplateCloneService $cloneService,
    ) {}

    public function show(Request $request, Organization $organization, int $template): Response
    {
        $this->authorize('viewAny', AppraisalTemplate::class);
        $this->assertAccessibleSourceOrganization($request, $organization);

        $template = $this->cloneService->findSourceTemplate($organization->id, $template);

        return Inertia::render('performance/templates/SharedShow', [
            'template' => $template,
            'sourceOrganization' => $organization->only(['id', 'name', 'slug']),
            'can' => [
                'import' => $request->user()->can('performance.templates.create'),
            ],
        ]);
    }

    public function import(Request $request, Organization $organization, int $template): RedirectResponse
    {
        $this->authorize('create', AppraisalTemplate::class);
        $this->assertAccessibleSourceOrganization($request, $organization);

        $source = $this->cloneService->findSourceTemplate($organization->id, $template);
        $cloned = $this->cloneService->cloneToCurrentOrganization($source);

        return to_route('performance.templates.index')
            ->with('success', "Template imported from {$organization->name} and is ready to use in this organisation.");
    }

    private function assertAccessibleSourceOrganization(Request $request, Organization $organization): void
    {
        abort_unless($organization->isActive(), 404);

        $currentOrganizationId = app(TenantContext::class)->requireId();

        abort_if(
            $organization->id === $currentOrganizationId,
            404,
            'Choose a different organisation to import a shared template.',
        );

        $canAccess = OrganizationContextController::availableOrganizationsFor($request->user())
            ->contains(fn (Organization $candidate) => $candidate->id === $organization->id);

        abort_unless($canAccess, 403);
    }
}
