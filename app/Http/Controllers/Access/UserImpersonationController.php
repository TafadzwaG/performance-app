<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Lab404\Impersonate\Services\ImpersonateManager;

class UserImpersonationController extends Controller
{
    public function store(User $user): RedirectResponse
    {
        $this->authorize('impersonate', $user);

        /** @var \App\Models\User $authUser */
        $authUser = Auth::user();

        abort_unless($authUser->impersonate($user), 400, 'Unable to impersonate the selected user.');

        return to_route('dashboard');
    }

    public function destroy(ImpersonateManager $impersonateManager): RedirectResponse
    {
        abort_unless($impersonateManager->isImpersonating(), 403);
        abort_unless($impersonateManager->leave(), 400, 'Unable to leave the active impersonation session.');

        return to_route('access.users.index');
    }
}
