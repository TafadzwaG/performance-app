<?php

namespace App\Listeners\Performance;

use App\Events\Performance\AppraisalStatusChanged;
use App\Services\Performance\AppraisalWorkflowNotificationService;

class SendAppraisalWorkflowNotifications
{
    public function __construct(
        private readonly AppraisalWorkflowNotificationService $notifications,
    ) {}

    public function handle(AppraisalStatusChanged $event): void
    {
        $this->notifications->handle($event);
    }
}
