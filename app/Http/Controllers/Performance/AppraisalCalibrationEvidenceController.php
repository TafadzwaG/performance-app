<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Appraisal;
use App\Models\AppraisalCalibration;
use App\Models\AppraisalCalibrationEvidence;
use App\Services\Performance\EvidenceStorageService;
use App\Support\Security\SafeExternalUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AppraisalCalibrationEvidenceController extends Controller
{
    public function download(
        Appraisal $appraisal,
        AppraisalCalibration $calibration,
        AppraisalCalibrationEvidence $evidence,
    ): StreamedResponse|RedirectResponse {
        $this->authorize('view', $appraisal);
        abort_unless($calibration->appraisal_id === $appraisal->id, 404);
        abort_unless($evidence->appraisal_calibration_id === $calibration->id, 404);

        if ($evidence->evidence_type->value === 'link') {
            abort_unless(SafeExternalUrl::isAllowed($evidence->url), 404);

            return redirect()->away($evidence->url);
        }

        $diskName = $evidence->disk ?: EvidenceStorageService::DISK;
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
            preg_replace('/[\r\n"\\\\]/', '', basename($evidence->original_name ?: basename($evidence->path))) ?: 'download',
            array_filter([
                'Content-Type' => $evidence->mime_type,
            ]),
        );
    }
}
