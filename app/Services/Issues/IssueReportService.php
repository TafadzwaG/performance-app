<?php

namespace App\Services\Issues;

use App\Enums\IssueStatus;
use App\Models\IssueReport;
use App\Models\IssueStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class IssueReportService
{
    public function __construct(
        private readonly IssueNotificationService $notifications,
    ) {}

    /**
     * @param  array{type:string,title:string,description:string}  $data
     */
    public function create(User $reporter, array $data): IssueReport
    {
        return DB::transaction(function () use ($reporter, $data) {
            $issue = IssueReport::query()->create([
                'reporter_user_id' => $reporter->id,
                'type' => $data['type'],
                'title' => $data['title'],
                'description' => $data['description'],
                'status' => IssueStatus::Pending,
            ]);

            $this->recordHistory(
                issue: $issue,
                actor: $reporter,
                fromStatus: null,
                toStatus: IssueStatus::Pending,
                fromAssigneeId: null,
                toAssigneeId: null,
                note: 'Issue submitted.',
            );

            $issue->refresh()->load(['reporter', 'assignee']);

            $this->notifications->notifyReported($issue);

            return $issue;
        });
    }

    /**
     * @param  array{type?:string,title?:string,description?:string}  $data
     */
    public function updateDetails(IssueReport $issue, User $actor, array $data): IssueReport
    {
        $issue->update(collect($data)->only(['type', 'title', 'description'])->all());

        return $issue->fresh(['reporter', 'assignee']);
    }

    public function assign(IssueReport $issue, User $actor, User $assignee, ?string $note = null): IssueReport
    {
        return DB::transaction(function () use ($issue, $actor, $assignee, $note) {
            $fromStatus = $issue->status;
            $fromAssigneeId = $issue->assignee_user_id;
            $nextStatus = $fromStatus === IssueStatus::Pending
                ? IssueStatus::InProgress
                : $fromStatus;

            $issue->update([
                'assignee_user_id' => $assignee->id,
                'status' => $nextStatus,
            ]);

            $this->recordHistory(
                issue: $issue,
                actor: $actor,
                fromStatus: $fromStatus,
                toStatus: $nextStatus,
                fromAssigneeId: $fromAssigneeId,
                toAssigneeId: $assignee->id,
                note: $note ?? 'Issue assigned.',
            );

            $issue->refresh()->load(['reporter', 'assignee']);

            $this->notifications->notifyAssigned($issue, $note);

            return $issue;
        });
    }

    public function updateStatus(IssueReport $issue, User $actor, IssueStatus $status, ?string $note = null): IssueReport
    {
        return DB::transaction(function () use ($issue, $actor, $status, $note) {
            $fromStatus = $issue->status;

            $issue->update([
                'status' => $status,
            ]);

            $this->recordHistory(
                issue: $issue,
                actor: $actor,
                fromStatus: $fromStatus,
                toStatus: $status,
                fromAssigneeId: $issue->assignee_user_id,
                toAssigneeId: $issue->assignee_user_id,
                note: $note,
            );

            $issue->refresh()->load(['reporter', 'assignee']);

            $this->notifications->notifyStatusChanged($issue, $note);

            return $issue;
        });
    }

    private function recordHistory(
        IssueReport $issue,
        User $actor,
        ?IssueStatus $fromStatus,
        ?IssueStatus $toStatus,
        ?int $fromAssigneeId,
        ?int $toAssigneeId,
        ?string $note,
    ): IssueStatusHistory {
        return IssueStatusHistory::query()->create([
            'issue_report_id' => $issue->id,
            'actor_user_id' => $actor->id,
            'from_status' => $fromStatus?->value,
            'to_status' => $toStatus?->value,
            'from_assignee_user_id' => $fromAssigneeId,
            'to_assignee_user_id' => $toAssigneeId,
            'note' => $note,
        ]);
    }
}
