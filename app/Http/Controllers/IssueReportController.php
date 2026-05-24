<?php

namespace App\Http\Controllers;

use App\Enums\IssueStatus;
use App\Enums\IssueType;
use App\Http\Requests\Issues\AssignIssueReportRequest;
use App\Http\Requests\Issues\StoreIssueReportRequest;
use App\Http\Requests\Issues\UpdateIssueReportRequest;
use App\Http\Requests\Issues\UpdateIssueStatusRequest;
use App\Models\IssueReport;
use App\Models\User;
use App\Services\Issues\IssueReportService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IssueReportController extends Controller
{
    public function __construct(
        private readonly IssueReportService $issueReportService,
    ) {
        $this->authorizeResource(IssueReport::class, 'issue');
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', IssueReport::class);

        $user = $request->user();
        $search = (string) $request->string('search');
        $status = $request->string('status')->toString();
        $type = $request->string('type')->toString();
        $assigneeUserId = $request->integer('assignee_user_id') ?: null;
        $reporterUserId = $request->integer('reporter_user_id') ?: null;

        $issues = $this->filteredQuery($request)
            ->with(['reporter:id,name,email', 'assignee:id,name,email'])
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('issues/Index', [
            'issues' => $issues,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
                'assignee_user_id' => $assigneeUserId ? (string) $assigneeUserId : '',
                'reporter_user_id' => $reporterUserId ? (string) $reporterUserId : '',
            ],
            'statusOptions' => $this->enumOptions(IssueStatus::cases()),
            'typeOptions' => $this->enumOptions(IssueType::cases()),
            'assigneeOptions' => $user->can('issues.view_all') ? $this->userOptions() : [],
            'reporterOptions' => $user->can('issues.view_all') ? $this->userOptions() : [],
            'can' => [
                'create' => $user->can('issues.create'),
                'viewAll' => $user->can('issues.view_all'),
                'assign' => $user->can('issues.assign'),
                'updateStatus' => $user->can('issues.update_status'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('issues/Create', [
            'typeOptions' => $this->enumOptions(IssueType::cases()),
        ]);
    }

    public function store(StoreIssueReportRequest $request): RedirectResponse
    {
        $issue = $this->issueReportService->create(
            $request->user(),
            $request->validated(),
        );

        return to_route('issues.show', $issue)
            ->with('success', 'Issue submitted successfully.');
    }

    public function show(IssueReport $issue): Response
    {
        $issue->load([
            'reporter:id,name,email',
            'assignee:id,name,email',
            'histories.actor:id,name',
            'histories.fromAssignee:id,name',
            'histories.toAssignee:id,name',
        ]);

        $user = request()->user();

        return Inertia::render('issues/Show', [
            'issue' => $issue,
            'statusOptions' => $this->enumOptions(IssueStatus::cases()),
            'typeOptions' => $this->enumOptions(IssueType::cases()),
            'assigneeOptions' => $user->can('issues.assign') ? $this->userOptions() : [],
            'can' => [
                'update' => $user->can('update', $issue),
                'assign' => $user->can('assign', $issue),
                'updateStatus' => $user->can('updateStatus', $issue),
            ],
        ]);
    }

    public function edit(IssueReport $issue): Response
    {
        $issue->load(['reporter:id,name,email', 'assignee:id,name,email']);

        return Inertia::render('issues/Edit', [
            'issue' => $issue,
            'typeOptions' => $this->enumOptions(IssueType::cases()),
            'statusOptions' => $this->enumOptions(IssueStatus::cases()),
            'assigneeOptions' => request()->user()->can('issues.assign') ? $this->userOptions() : [],
            'can' => [
                'assign' => request()->user()->can('assign', $issue),
                'updateStatus' => request()->user()->can('updateStatus', $issue),
            ],
        ]);
    }

    public function update(UpdateIssueReportRequest $request, IssueReport $issue): RedirectResponse
    {
        $this->issueReportService->updateDetails(
            $issue,
            $request->user(),
            $request->validated(),
        );

        return to_route('issues.show', $issue)
            ->with('success', 'Issue updated successfully.');
    }

    public function assign(AssignIssueReportRequest $request, IssueReport $issue): RedirectResponse
    {
        $this->authorize('assign', $issue);

        $assignee = User::query()->findOrFail($request->integer('assignee_user_id'));

        $this->issueReportService->assign(
            $issue,
            $request->user(),
            $assignee,
            $request->validated('note'),
        );

        return to_route('issues.show', $issue)
            ->with('success', 'Issue assigned successfully.');
    }

    public function updateStatus(UpdateIssueStatusRequest $request, IssueReport $issue): RedirectResponse
    {
        $this->authorize('updateStatus', $issue);

        $this->issueReportService->updateStatus(
            $issue,
            $request->user(),
            IssueStatus::from($request->validated('status')),
            $request->validated('note'),
        );

        return to_route('issues.show', $issue)
            ->with('success', 'Issue status updated successfully.');
    }

    public function destroy(IssueReport $issue): RedirectResponse
    {
        abort(403);
    }

    private function filteredQuery(Request $request): Builder
    {
        $user = $request->user();
        $search = (string) $request->string('search');
        $status = $request->string('status')->toString();
        $type = $request->string('type')->toString();
        $assigneeUserId = $request->integer('assignee_user_id') ?: null;
        $reporterUserId = $request->integer('reporter_user_id') ?: null;

        $query = IssueReport::query();

        if (! $user->can('issues.view_all')) {
            $query->where('reporter_user_id', $user->id);
        }

        return $query
            ->when($status !== '', fn (Builder $builder) => $builder->where('status', $status))
            ->when($type !== '', fn (Builder $builder) => $builder->where('type', $type))
            ->when($assigneeUserId, fn (Builder $builder) => $builder->where('assignee_user_id', $assigneeUserId))
            ->when($reporterUserId, fn (Builder $builder) => $builder->where('reporter_user_id', $reporterUserId))
            ->when($search !== '', function (Builder $builder) use ($search) {
                $builder->where(function (Builder $sub) use ($search) {
                    $sub->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");

                    if (ctype_digit($search)) {
                        $sub->orWhere('id', (int) $search);
                    }
                });
            });
    }

    /**
     * @param  array<int, IssueStatus|IssueType>  $cases
     * @return list<array{value:string,label:string}>
     */
    private function enumOptions(array $cases): array
    {
        return collect($cases)
            ->map(fn ($case) => [
                'value' => $case->value,
                'label' => $case->label(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{value:int,label:string}>
     */
    private function userOptions(): array
    {
        return User::query()
            ->where('is_approved', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user) => [
                'value' => $user->id,
                'label' => "{$user->name} ({$user->email})",
            ])
            ->values()
            ->all();
    }
}
