<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\UserSignupPendingApproval;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_approved' => false,
        ]);

        $employeeRole = Role::query()
            ->where('name', 'Employee')
            ->where('guard_name', 'web')
            ->first();

        if ($employeeRole) {
            $user->syncRoles([$employeeRole]);
        }

        event(new Registered($user));

        $this->notifySuperAdminsOfPendingSignup($user);

        return to_route('pending-approval')->with('status', 'Registration submitted. Your account is pending admin approval.');
    }

    /**
     * Send a styled approval-request email to every Super Admin, CC'ing the
     * applicant so they have a paper trail of their own request.
     */
    private function notifySuperAdminsOfPendingSignup(User $applicant): void
    {
        try {
            $recipients = User::query()
                ->whereHas('roles', fn ($query) => $query->where('name', 'Super Admin'))
                ->where('is_approved', true)
                ->whereNotNull('email')
                ->pluck('email')
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (empty($recipients)) {
                return;
            }

            Mail::to($recipients)->send(new UserSignupPendingApproval($applicant));
        } catch (\Throwable $exception) {
            // Email outages must never block registration; surface in the log instead.
            Log::warning('Failed to send signup approval email', [
                'applicant_id' => $applicant->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
