<?php

namespace App\Http\Controllers\Settings;

use App\Enums\DisasterRecovery\BackupStatus;
use App\Http\Controllers\Controller;
use App\Models\DisasterRecoveryBackup;
use App\Models\DisasterRecoveryRestoreRequest;
use App\Services\DisasterRecovery\DisasterRecoveryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DisasterRecoveryController extends Controller
{
    public function index(DisasterRecoveryService $disasterRecovery): Response
    {
        return Inertia::render('settings/disaster-recovery/Index', $disasterRecovery->snapshot());
    }

    public function storeBackup(Request $request, DisasterRecoveryService $disasterRecovery): RedirectResponse
    {
        $disasterRecovery->queueManualBackup($request->user());

        return to_route('settings.disaster_recovery.index')->with('success', 'Disaster recovery backup queued.');
    }

    public function showBackup(DisasterRecoveryBackup $backup)
    {
        abort_unless($backup->status === BackupStatus::Completed && $backup->disk && $backup->path, 404);
        abort_unless(Storage::disk($backup->disk)->exists($backup->path), 404);

        return Storage::disk($backup->disk)->download($backup->path, $backup->filename ?: basename($backup->path));
    }

    public function storeRestore(Request $request, DisasterRecoveryService $disasterRecovery): RedirectResponse
    {
        $validated = $request->validate([
            'backup_id' => ['required', 'integer', 'exists:disaster_recovery_backups,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $backup = DisasterRecoveryBackup::query()->findOrFail($validated['backup_id']);
        $disasterRecovery->requestRestore($request->user(), $backup, $validated['notes'] ?? null);

        return to_route('settings.disaster_recovery.index')->with('success', 'Restore request submitted for approval.');
    }

    public function approveRestore(Request $request, DisasterRecoveryRestoreRequest $restore, DisasterRecoveryService $disasterRecovery): RedirectResponse
    {
        $validated = $request->validate([
            'confirmation_phrase' => [
                'required',
                'string',
                Rule::in([(string) config('disaster_recovery.restore_confirmation_phrase')]),
            ],
        ]);

        $disasterRecovery->approveRestore($request->user(), $restore, $validated['confirmation_phrase']);

        return to_route('settings.disaster_recovery.index')->with('success', 'Restore approved and queued.');
    }

    public function rejectRestore(Request $request, DisasterRecoveryRestoreRequest $restore, DisasterRecoveryService $disasterRecovery): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $disasterRecovery->rejectRestore($request->user(), $restore, $validated['reason'] ?? null);

        return to_route('settings.disaster_recovery.index')->with('success', 'Restore request rejected.');
    }

    public function restoreTests(DisasterRecoveryService $disasterRecovery): Response
    {
        return Inertia::render('settings/disaster-recovery/Index', $disasterRecovery->snapshot());
    }
}
