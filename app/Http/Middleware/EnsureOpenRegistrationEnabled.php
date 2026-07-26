<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOpenRegistrationEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! SystemSetting::current()->open_registration_enabled) {
            abort(404);
        }

        return $next($request);
    }
}
