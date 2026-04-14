<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\StoreObjectiveEvidenceRequest;
use App\Models\Appraisal;
use App\Models\AppraisalObjectiveEvidence;
use App\Models\AppraisalObjective;
use App\Services\Performance\EvidenceStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function download(
        Appraisal $appraisal,
        AppraisalObjective $objective,
        AppraisalObjectiveEvidence $evidence,
    ): StreamedResponse|RedirectResponse {
        $this->authorize('view', $appraisal);
        abort_unless($objective->appraisal_id === $appraisal->id, 404);
        abort_unless($evidence->appraisal_objective_id === $objective->id, 404);

        if ($evidence->evidence_type->value === 'link') {
            abort_unless(filled($evidence->url), 404);

            return redirect()->away($evidence->url);
        }

        $diskName = $evidence->disk ?: 'public';
        abort_unless(filled($evidence->path), 404);

        $disk = Storage::disk($diskName);
        abort_unless($disk->exists($evidence->path), 404);

        $stream = $disk->readStream($evidence->path);
        abort_unless(is_resource($stream), 404);

        return response()->streamDownload(
            function () use ($stream): void {
                fpassthru($stream);

                if (is_resource($stream)) {
                    fclose($stream);
                }
            },
            $evidence->original_name ?: basename($evidence->path),
            array_filter([
                'Content-Type' => $evidence->mime_type,
            ]),
        );
    }
}
