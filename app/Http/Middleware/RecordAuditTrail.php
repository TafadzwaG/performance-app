<?php

namespace App\Http\Middleware;

use App\Services\Audit\AuditTrailRecorder;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RecordAuditTrail
{
    public function __construct(
        protected AuditTrailRecorder $auditTrailRecorder,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        try {
            /** @var Response $response */
            $response = $next($request);
        } catch (Throwable $exception) {
            $this->auditTrailRecorder->record($request, null, $exception);

            throw $exception;
        }

        $this->auditTrailRecorder->record($request, $response);

        return $response;
    }
}
