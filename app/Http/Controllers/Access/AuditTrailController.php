<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditTrailController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $method = strtoupper(trim((string) $request->string('method')));
        $status = trim((string) $request->string('status'));

        $query = AuditTrail::query()
            ->with([
                'user:id,name,email',
                'impersonator:id,name,email',
            ])
            ->when($search !== '', function (Builder $builder) use ($search) {
                $builder->where(function (Builder $nested) use ($search) {
                    $nested->where('action', 'like', "%{$search}%")
                        ->orWhere('route_name', 'like', "%{$search}%")
                        ->orWhere('subject_label', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%")
                        ->orWhereHas('user', function (Builder $userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('impersonator', function (Builder $userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when(in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true), fn (Builder $builder) => $builder->where('method', $method))
            ->when($status === 'success', fn (Builder $builder) => $builder->where('response_status', '<', 400))
            ->when($status === 'failed', fn (Builder $builder) => $builder->where('response_status', '>=', 400));

        $statsQuery = clone $query;

        $auditTrails = $query
            ->latest('occurred_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('access/audit-trails/Index', [
            'auditTrails' => $auditTrails,
            'filters' => [
                'search' => $search,
                'method' => $method,
                'status' => $status,
            ],
            'summary' => [
                'total' => (clone $statsQuery)->count(),
                'today' => (clone $statsQuery)->whereDate('occurred_at', today())->count(),
                'unique_actors' => (clone $statsQuery)->whereNotNull('user_id')->distinct('user_id')->count('user_id'),
                'impersonated' => (clone $statsQuery)->whereNotNull('impersonator_user_id')->count(),
                'failed' => (clone $statsQuery)->where('response_status', '>=', 400)->count(),
            ],
            'methodOptions' => [
                ['value' => '', 'label' => 'All methods'],
                ['value' => 'POST', 'label' => 'POST'],
                ['value' => 'PUT', 'label' => 'PUT'],
                ['value' => 'PATCH', 'label' => 'PATCH'],
                ['value' => 'DELETE', 'label' => 'DELETE'],
            ],
            'statusOptions' => [
                ['value' => '', 'label' => 'All statuses'],
                ['value' => 'success', 'label' => 'Successful'],
                ['value' => 'failed', 'label' => 'Failed'],
            ],
        ]);
    }
}
