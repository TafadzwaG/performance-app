<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Appraisal;
use App\Services\Performance\DashboardGoalsViewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardGoalsController extends Controller
{
    public function __construct(
        private readonly DashboardGoalsViewService $goalsViewService,
    ) {}

    public function lookup(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('performance.dashboard.view'), 403);

        return response()->json([
            'results' => $this->goalsViewService->lookup(
                $request->user(),
                (string) $request->string('q'),
            ),
        ]);
    }

    public function show(Request $request, Appraisal $appraisal): JsonResponse
    {
        abort_unless($request->user()?->can('performance.dashboard.view'), 403);
        abort_unless($this->goalsViewService->userOwnsAppraisal($request->user(), $appraisal), 403);

        $payload = $this->goalsViewService->payloadFor($appraisal);
        $current = $this->goalsViewService->currentGoalsFor($request->user());
        $payload['is_current'] = $current !== null && $current['appraisal_id'] === $appraisal->id;

        return response()->json($payload);
    }
}
