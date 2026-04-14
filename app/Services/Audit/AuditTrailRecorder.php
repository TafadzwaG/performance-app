<?php

namespace App\Services\Audit;

use App\Models\AuditTrail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Lab404\Impersonate\Services\ImpersonateManager;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuditTrailRecorder
{
    public function __construct(
        protected ImpersonateManager $impersonateManager,
    ) {
    }

    public function record(Request $request, ?Response $response = null, ?Throwable $exception = null): void
    {
        if (! $this->shouldRecord($request)) {
            return;
        }

        $subject = collect($request->route()?->parametersWithoutNulls() ?? [])
            ->first(fn (mixed $parameter) => $parameter instanceof Model);

        $impersonator = $this->impersonateManager->isImpersonating()
            ? $this->impersonateManager->getImpersonator()
            : null;

        AuditTrail::query()->create([
            'user_id' => $request->user()?->getKey(),
            'impersonator_user_id' => $impersonator?->getKey(),
            'action' => $this->resolveAction($request, $exception),
            'method' => strtoupper($request->method()),
            'route_name' => $request->route()?->getName(),
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000, '...'),
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'subject_label' => $this->resolveSubjectLabel($subject),
            'request_payload' => $this->sanitizePayload($request),
            'response_status' => $exception ? 500 : ($response?->getStatusCode() ?? 200),
            'occurred_at' => now(),
        ]);
    }

    protected function shouldRecord(Request $request): bool
    {
        if (! $request->route()) {
            return false;
        }

        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return false;
        }

        return ! $request->routeIs('ignition.*');
    }

    protected function resolveAction(Request $request, ?Throwable $exception): string
    {
        if ($exception) {
            return 'exception';
        }

        $routeName = (string) $request->route()?->getName();

        return match (true) {
            $routeName === 'login' => 'login',
            $routeName === 'logout' => 'logout',
            Str::contains($routeName, 'impersonate.store') => 'impersonate',
            Str::contains($routeName, 'impersonation.destroy') => 'stop_impersonation',
            Str::contains($routeName, 'bulk_store') => 'bulk_create',
            Str::contains($routeName, 'import.store') => 'import',
            Str::contains($routeName, 'complete.store') => 'complete_profile',
            Str::endsWith($routeName, '.store') => 'create',
            Str::endsWith($routeName, '.update') => 'update',
            Str::endsWith($routeName, '.destroy') => 'delete',
            Str::contains($routeName, '.open') => 'open',
            Str::contains($routeName, '.close') => 'close',
            default => Str::lower($request->method()),
        };
    }

    protected function resolveSubjectLabel(?Model $subject): ?string
    {
        if (! $subject) {
            return null;
        }

        foreach (['name', 'title', 'code', 'employee_number'] as $attribute) {
            if ($subject->getAttribute($attribute)) {
                return (string) $subject->getAttribute($attribute);
            }
        }

        return class_basename($subject).' #'.$subject->getKey();
    }

    protected function sanitizePayload(Request $request): array
    {
        $payload = $request->except([
            'password',
            'password_confirmation',
            'current_password',
            'new_password',
            'new_password_confirmation',
            '_token',
        ]);

        if ($request->allFiles()) {
            $payload = array_merge($payload, [
                '_files' => collect($request->allFiles())
                    ->map(fn (mixed $value) => $this->normalizeValue($value))
                    ->all(),
            ]);
        }

        return collect($payload)
            ->map(fn (mixed $value) => $this->normalizeValue($value))
            ->all();
    }

    protected function normalizeValue(mixed $value): mixed
    {
        if ($value instanceof UploadedFile) {
            $size = null;
            $mime = null;

            try {
                $size = $value->getSize();
            } catch (Throwable) {
                // The temporary upload file may no longer exist when audit runs.
                $size = null;
            }

            try {
                $mime = $value->getClientMimeType();
            } catch (Throwable) {
                $mime = null;
            }

            return [
                'name' => $value->getClientOriginalName(),
                'size' => $size,
                'mime' => $mime,
            ];
        }

        if (is_array($value)) {
            if (Arr::isList($value) && count($value) > 10) {
                return [
                    'count' => count($value),
                    'sample' => collect(array_slice($value, 0, 10))
                        ->map(fn (mixed $item) => $this->normalizeValue($item))
                        ->all(),
                ];
            }

            return collect($value)
                ->map(fn (mixed $item) => $this->normalizeValue($item))
                ->all();
        }

        if (is_string($value)) {
            return Str::limit($value, 300, '...');
        }

        return $value;
    }
}
