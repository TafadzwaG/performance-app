<?php

namespace App\Listeners\Performance;

use App\Events\Performance\AppraisalStatusChanged;
use Illuminate\Support\Facades\Cache;

class InvalidateDashboardCache
{
    public function handle(AppraisalStatusChanged $event): void
    {
        $appraisal = $event->appraisal;

        $userIds = array_filter([
            $appraisal->employee_user_id,
            $appraisal->line_manager_user_id,
            $appraisal->approving_manager_user_id,
            $event->actor?->id,
        ]);

        foreach (array_unique($userIds) as $userId) {
            Cache::forget("performance:dashboard:user:{$userId}");
        }
    }
}
