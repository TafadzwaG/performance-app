<?php

namespace App\Services\DisasterRecovery;

use App\Enums\DisasterRecovery\BackupStatus;
use App\Enums\DisasterRecovery\BackupTrigger;
use App\Enums\DisasterRecovery\RestoreRequestStatus;
use App\Jobs\DisasterRecovery\RunDisasterRecoveryBackupJob;
use App\Jobs\DisasterRecovery\RunDisasterRecoveryRestoreJob;
use App\Models\DisasterRecoveryBackup;
use App\Models\DisasterRecoveryRestoreRequest;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Number;

class DisasterRecoveryService
{
    public function __construct(private BackupArchiveService $archives) {}

    /**
     * @return array<string, mixed>
     */
    public function snapshot(): array
    {
        return [
            'confirmationPhrase' => (string) config('disaster_recovery.restore_confirmation_phrase'),
            'backupDisk' => $this->archives->diskName(),
            'backupPath' => (string) config('disaster_recovery.path', 'hr-backups'),
            'backups' => DisasterRecoveryBackup::query()
                ->with('creator:id,name,email')
                ->latest()
                ->limit(25)
                ->get()
                ->map(fn (DisasterRecoveryBackup $backup) => $this->formatBackup($backup))
                ->values(),
            'restoreRequests' => DisasterRecoveryRestoreRequest::query()
                ->with(['backup:id,filename,path,checksum,status', 'requester:id,name,email', 'approver:id,name,email', 'preRestoreBackup:id,filename,status'])
                ->latest()
                ->limit(25)
                ->get()
                ->map(fn (DisasterRecoveryRestoreRequest $restore) => $this->formatRestoreRequest($restore))
                ->values(),
            'restoreTests' => app(RestoreTestService::class)->latestResults(),
            'retention' => config('disaster_recovery.retention'),
        ];
    }

    public function queueManualBackup(User $user): DisasterRecoveryBackup
    {
        $backup = $this->archives->createQueuedBackup(BackupTrigger::Manual, $user->id);

        RunDisasterRecoveryBackupJob::dispatch($backup);

        return $backup;
    }

    public function createAutomaticBackup(): DisasterRecoveryBackup
    {
        return $this->archives->createQueuedBackup(BackupTrigger::Automatic);
    }

    public function requestRestore(User $requester, DisasterRecoveryBackup $backup, ?string $notes): DisasterRecoveryRestoreRequest
    {
        if (! $requester->hasRole('Super Admin')) {
            abort(403, 'Only Super Admin users can request production restores.');
        }

        if ($backup->status !== BackupStatus::Completed) {
            abort(422, 'Only completed backups can be restored.');
        }

        return DisasterRecoveryRestoreRequest::query()->create([
            'disaster_recovery_backup_id' => $backup->id,
            'requested_by_user_id' => $requester->id,
            'status' => RestoreRequestStatus::PendingApproval,
            'notes' => $notes,
        ]);
    }

    public function approveRestore(User $approver, DisasterRecoveryRestoreRequest $restore, string $confirmationPhrase): DisasterRecoveryRestoreRequest
    {
        if (! $approver->hasRole('Super Admin')) {
            abort(403, 'Only Super Admin users can approve production restores.');
        }

        if ($restore->requested_by_user_id === $approver->id) {
            abort(403, 'A different Super Admin must approve this restore.');
        }

        if ($restore->status !== RestoreRequestStatus::PendingApproval) {
            abort(422, 'Only pending restore requests can be approved.');
        }

        if ($confirmationPhrase !== (string) config('disaster_recovery.restore_confirmation_phrase')) {
            abort(422, 'The restore confirmation phrase does not match.');
        }

        $restore->update([
            'status' => RestoreRequestStatus::Approved,
            'approved_by_user_id' => $approver->id,
            'confirmation_phrase' => $confirmationPhrase,
            'approved_at' => now(),
        ]);

        RunDisasterRecoveryRestoreJob::dispatch($restore->refresh());

        return $restore->refresh();
    }

    public function rejectRestore(User $approver, DisasterRecoveryRestoreRequest $restore, ?string $reason): DisasterRecoveryRestoreRequest
    {
        if (! $approver->hasRole('Super Admin')) {
            abort(403, 'Only Super Admin users can reject production restores.');
        }

        if ($restore->status !== RestoreRequestStatus::PendingApproval) {
            abort(422, 'Only pending restore requests can be rejected.');
        }

        $restore->update([
            'status' => RestoreRequestStatus::Rejected,
            'approved_by_user_id' => $approver->id,
            'rejection_reason' => $reason,
            'rejected_at' => now(),
            'completed_at' => now(),
        ]);

        return $restore->refresh();
    }

    /**
     * @return array<string, mixed>
     */
    public function formatBackup(DisasterRecoveryBackup $backup): array
    {
        return [
            'id' => $backup->id,
            'trigger' => $backup->trigger->value,
            'status' => $backup->status->value,
            'disk' => $backup->disk,
            'path' => $backup->path,
            'filename' => $backup->filename,
            'size_bytes' => $backup->size_bytes,
            'size_human' => $backup->size_bytes ? Number::fileSize((int) $backup->size_bytes) : null,
            'checksum' => $backup->checksum,
            'error_message' => $backup->error_message,
            'created_by' => $backup->creator?->only(['id', 'name', 'email']),
            'created_at' => $backup->created_at?->toDateTimeString(),
            'completed_at' => $backup->completed_at?->toDateTimeString(),
            'download_available' => $backup->status === BackupStatus::Completed
                && $backup->disk
                && $backup->path
                && Storage::disk($backup->disk)->exists($backup->path),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatRestoreRequest(DisasterRecoveryRestoreRequest $restore): array
    {
        return [
            'id' => $restore->id,
            'status' => $restore->status->value,
            'notes' => $restore->notes,
            'rejection_reason' => $restore->rejection_reason,
            'error_message' => $restore->error_message,
            'backup' => $restore->backup ? [
                'id' => $restore->backup->id,
                'filename' => $restore->backup->filename,
                'path' => $restore->backup->path,
                'checksum' => $restore->backup->checksum,
                'status' => $restore->backup->status instanceof BackupStatus ? $restore->backup->status->value : $restore->backup->status,
            ] : null,
            'pre_restore_backup' => $restore->preRestoreBackup ? [
                'id' => $restore->preRestoreBackup->id,
                'filename' => $restore->preRestoreBackup->filename,
                'status' => $restore->preRestoreBackup->status instanceof BackupStatus
                    ? $restore->preRestoreBackup->status->value
                    : $restore->preRestoreBackup->status,
            ] : null,
            'requester' => $restore->requester?->only(['id', 'name', 'email']),
            'approver' => $restore->approver?->only(['id', 'name', 'email']),
            'created_at' => $restore->created_at?->toDateTimeString(),
            'approved_at' => $restore->approved_at?->toDateTimeString(),
            'completed_at' => $restore->completed_at?->toDateTimeString(),
        ];
    }
}
