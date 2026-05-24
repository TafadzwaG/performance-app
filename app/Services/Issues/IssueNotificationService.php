<?php

namespace App\Services\Issues;

use App\Models\IssueReport;
use App\Models\User;
use App\Notifications\Issues\IssueAssignedNotification;
use App\Notifications\Issues\IssueReportedNotification;
use App\Notifications\Issues\IssueStatusChangedNotification;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class IssueNotificationService
{
    public function notifyReported(IssueReport $issue): void
    {
        if ($issue->reporter === null) {
            return;
        }

        $issue->reporter->notify(new IssueReportedNotification($issue));
    }

    public function notifyAssigned(IssueReport $issue, ?string $note = null): void
    {
        $this->notifyParticipants($issue, new IssueAssignedNotification($issue, $note));
    }

    public function notifyStatusChanged(IssueReport $issue, ?string $note = null): void
    {
        $this->notifyParticipants($issue, new IssueStatusChangedNotification($issue, $note));
    }

    private function notifyParticipants(IssueReport $issue, Notification $notification): void
    {
        $this->uniqueRecipients($issue)->each(
            fn (User $user) => $user->notify($notification),
        );
    }

    /**
     * @return Collection<int, User>
     */
    private function uniqueRecipients(IssueReport $issue): Collection
    {
        return collect([$issue->reporter, $issue->assignee])
            ->filter(fn ($user) => $user instanceof User)
            ->unique(fn (User $user) => $user->id)
            ->values();
    }
}
