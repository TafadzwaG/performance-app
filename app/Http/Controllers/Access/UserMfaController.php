<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserMfaController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->can('access.users.view'), 403);

        $search = (string) $request->string('search');
        $status = (string) $request->string('status', 'all');
        $settings = SystemSetting::current();

        if (! in_array($status, ['all', 'enabled', 'disabled'], true)) {
            $status = 'all';
        }

        $users = User::query()
            ->with('roles:id,name')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($status === 'enabled', fn ($query) => $query->where('email_mfa_enabled', true))
            ->when($status === 'disabled', fn ($query) => $query->where('email_mfa_enabled', false))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('access/users/Mfa', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'globalMfaRequired' => (bool) $settings->email_mfa_required,
            'canManageUserMfa' => $request->user()->can('access.users.update'),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->can('access.users.update'), 403);

        if (SystemSetting::current()->email_mfa_required) {
            return back()->withErrors([
                'mfa' => 'Per-user MFA cannot be changed while global MFA is enforced.',
            ]);
        }

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $enabled = (bool) $validated['enabled'];

        $user->forceFill([
            'email_mfa_enabled' => $enabled,
            'email_mfa_enabled_at' => $enabled ? now() : null,
        ])->save();

        return back()->with('success', $enabled
            ? "Email MFA enabled for {$user->name}."
            : "Email MFA disabled for {$user->name}.");
    }
}
