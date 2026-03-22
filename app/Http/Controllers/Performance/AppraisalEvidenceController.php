<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\StoreObjectiveEvidenceRequest;
use App\Models\Appraisal;
use App\Models\AppraisalObjective;
use App\Services\Performance\EvidenceStorageService;
use Illuminate\Http\RedirectResponse;

class AppraisalEvidenceController extends Controller
{
    public function __construct(
        private readonly EvidenceStorageService $evidenceStorageService,
    ) {
    }

    public function store(StoreObjectiveEvidenceRequest $request, Appraisal $appraisal, AppraisalObjective $objective): RedirectResponse
    {
        $this->authorize('uploadEvidence', $appraisal);
        abort_unless($objective->appraisal_id === $appraisal->id, 404);

        if ($request->input('evidence_type') === 'file') {
            $this->evidenceStorageService->storeFile($objective, $request->file('file'), $request->user(), $request->input('notes'));
        } else {
            $this->evidenceStorageService->storeLink($objective, $request->input('url'), $request->user(), $request->input('notes'));
        }

        return back();
    }
}
