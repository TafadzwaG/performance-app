<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Settings\SystemOperationsService;
use Illuminate\Http\RedirectResponse;

class SystemOperationsController extends Controller
{
    public function retryFailedJob(int $job, SystemOperationsService $operations): RedirectResponse
    {
        $operations->retryFailedJob($job);

        return to_route('settings.index', ['tab' => 'operations'])->with('success', 'Failed job queued for retry.');
    }

    public function forgetFailedJob(int $job, SystemOperationsService $operations): RedirectResponse
    {
        $operations->forgetFailedJob($job);

        return to_route('settings.index', ['tab' => 'operations'])->with('success', 'Failed job removed.');
    }

    public function flushFailedJobs(SystemOperationsService $operations): RedirectResponse
    {
        $count = $operations->flushFailedJobs();

        return to_route('settings.index', ['tab' => 'operations'])->with('success', "Cleared {$count} failed job(s).");
    }

    public function deletePendingJob(int $job, SystemOperationsService $operations): RedirectResponse
    {
        $operations->deletePendingJob($job);

        return to_route('settings.index', ['tab' => 'operations'])->with('success', 'Pending job removed.');
    }
}
