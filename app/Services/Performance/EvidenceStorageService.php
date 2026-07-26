<?php

namespace App\Services\Performance;

use App\Models\AppraisalCalibration;
use App\Models\AppraisalCalibrationEvidence;
use App\Models\AppraisalObjective;
use App\Models\AppraisalObjectiveEvidence;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class EvidenceStorageService
{
    public const DISK = 'local';

    public function storeFile(AppraisalObjective $objective, UploadedFile $file, User $user, ?string $notes = null): AppraisalObjectiveEvidence
    {
        $organizationId = app(TenantContext::class)->requireId();
        $path = $file->store("organizations/{$organizationId}/performance/evidence/{$objective->id}", self::DISK);

        return AppraisalObjectiveEvidence::create([
            'appraisal_objective_id' => $objective->id,
            'uploaded_by_user_id' => $user->id,
            'evidence_type' => 'file',
            'disk' => self::DISK,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'notes' => $notes,
        ]);
    }

    public function storeLink(AppraisalObjective $objective, string $url, User $user, ?string $notes = null): AppraisalObjectiveEvidence
    {
        return AppraisalObjectiveEvidence::create([
            'appraisal_objective_id' => $objective->id,
            'uploaded_by_user_id' => $user->id,
            'evidence_type' => 'link',
            'url' => $url,
            'notes' => $notes,
        ]);
    }

    public function delete(AppraisalObjectiveEvidence $evidence): void
    {
        if ($evidence->disk && $evidence->path) {
            Storage::disk($evidence->disk)->delete($evidence->path);
        }

        $evidence->delete();
    }

    public function storeCalibrationFile(
        AppraisalCalibration $calibration,
        UploadedFile $file,
        User $user,
        ?string $notes = null,
    ): AppraisalCalibrationEvidence {
        $organizationId = app(TenantContext::class)->requireId();
        $path = $file->store("organizations/{$organizationId}/performance/calibration-evidence/{$calibration->id}", self::DISK);

        return AppraisalCalibrationEvidence::create([
            'appraisal_calibration_id' => $calibration->id,
            'uploaded_by_user_id' => $user->id,
            'evidence_type' => 'file',
            'disk' => self::DISK,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'notes' => $notes,
        ]);
    }
}
