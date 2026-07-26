<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Services\Platform\Export\MembershipExportService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MembershipController extends Controller
{
    public function index(Request $request): Response
    {
        $memberships = $this->membershipQuery($request)
            ->paginate(25)
            ->withQueryString()
            ->through(fn (OrganizationMembership $membership) => $this->formatMembership($membership));

        return Inertia::render('platform/memberships/Index', [
            'memberships' => $memberships,
            'filters' => [
                'search' => trim((string) $request->string('search')),
                'status' => (string) $request->string('status', 'all'),
                'organization_id' => $request->integer('organization_id') ?: null,
            ],
            'stats' => [
                'total' => OrganizationMembership::query()->count(),
                'active' => OrganizationMembership::query()->where('status', 'active')->count(),
                'organizations' => OrganizationMembership::query()->distinct('organization_id')->count('organization_id'),
                'default' => OrganizationMembership::query()->where('is_default', true)->count(),
            ],
            'organizationOptions' => Organization::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Organization $organization) => [
                    'value' => $organization->id,
                    'label' => $organization->name,
                ])
                ->values()
                ->all(),
        ]);
    }

    public function export(Request $request, MembershipExportService $exportService): BinaryFileResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['all', 'active', 'invited', 'suspended'])],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'format' => ['nullable', 'string', Rule::in(['xlsx', 'pdf'])],
        ]);

        $rows = $this->membershipQuery($request)->get();
        $filters = $this->exportFilters($request);
        $format = $validated['format'] ?? 'xlsx';

        return match ($format) {
            'pdf' => $exportService->pdf($rows, $request->user(), $filters),
            default => $exportService->excel($rows, $request->user(), $filters),
        };
    }

    /**
     * @return array{search: string, status: string, organization_id: int|null, organization_name: string|null}
     */
    private function exportFilters(Request $request): array
    {
        $organizationId = $request->integer('organization_id') ?: null;

        return [
            'search' => trim((string) $request->string('search')),
            'status' => (string) $request->string('status', 'all'),
            'organization_id' => $organizationId,
            'organization_name' => $organizationId
                ? Organization::query()->whereKey($organizationId)->value('name')
                : null,
        ];
    }

    private function membershipQuery(Request $request): Builder
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $organizationId = $request->integer('organization_id');

        return OrganizationMembership::query()
            ->with([
                'organization:id,name,slug,status',
                'user' => fn ($query) => $query->withoutGlobalScopes()->select('id', 'name', 'email'),
            ])
            ->when($search !== '', function (Builder $query) use ($search) {
                $like = "%{$search}%";
                $query->where(function (Builder $sub) use ($like) {
                    $sub->whereHas('user', fn (Builder $user) => $user
                        ->withoutGlobalScopes()
                        ->where(function (Builder $userQuery) use ($like) {
                            $userQuery->where('name', 'like', $like)
                                ->orWhere('email', 'like', $like);
                        }))
                        ->orWhereHas('organization', fn (Builder $organization) => $organization
                            ->where('name', 'like', $like)
                            ->orWhere('slug', 'like', $like));
                });
            })
            ->when($status !== '' && $status !== 'all', fn (Builder $query) => $query->where('status', $status))
            ->when($organizationId > 0, fn (Builder $query) => $query->where('organization_id', $organizationId))
            ->orderBy('organization_id')
            ->orderBy('status')
            ->orderBy('user_id');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatMembership(OrganizationMembership $membership): array
    {
        return [
            'id' => $membership->id,
            'status' => $membership->status,
            'is_default' => $membership->is_default,
            'access_all_locations' => $membership->access_all_locations,
            'activated_at' => optional($membership->activated_at)?->toIso8601String(),
            'organization' => $membership->organization?->only(['id', 'name', 'slug', 'status']),
            'user' => $membership->user?->only(['id', 'name', 'email']),
        ];
    }
}
