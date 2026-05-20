<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Services\Settings\SystemOperationsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StorageManagementController extends Controller
{
    public function __construct()
    {
        $this->middleware(function (Request $request, $next) {
            $user = $request->user();

            if ($user && ($user->can('access.storage.manage') || $user->can('system.settings.manage'))) {
                return $next($request);
            }

            abort(403);
        });
    }

    public function index(Request $request, SystemOperationsService $operations): Response
    {
        $zone = $request->filled('zone') ? $request->string('zone')->toString() : null;
        $path = $request->filled('path') ? $request->string('path')->toString() : null;
        $listAll = $request->query('list') === 'all';

        return Inertia::render('access/storage/Index', [
            'storage' => $operations->storageOverview(),
            'files' => $operations->filesOverview($zone, $path, $listAll),
        ]);
    }

    public function download(Request $request, SystemOperationsService $operations): BinaryFileResponse
    {
        $validated = $request->validate([
            'zone' => ['required', 'string'],
            'path' => ['required', 'string', 'max:500'],
            'inline' => ['sometimes', 'boolean'],
        ]);

        $absolute = $operations->absoluteFilePath($validated['zone'], $validated['path']);
        $inline = $request->boolean('inline');

        return response()->download(
            $absolute,
            basename($absolute),
            $inline ? ['Content-Disposition' => 'inline; filename="'.basename($absolute).'"'] : [],
        );
    }

    public function deleteFile(Request $request, SystemOperationsService $operations): RedirectResponse
    {
        $validated = $request->validate([
            'zone' => ['required', 'string'],
            'path' => ['required', 'string', 'max:500'],
        ]);

        $operations->deleteFile($validated['zone'], $validated['path']);

        $listAll = $request->input('list') === 'all';

        return $this->redirectToBrowser($validated['zone'], $listAll ? null : $this->parentPath($validated['path']), $listAll);
    }

    public function purgeZone(string $zone, SystemOperationsService $operations): RedirectResponse
    {
        $zone = $operations->resolveZoneKey($zone);
        $count = $operations->purgeZone($zone);

        return to_route('access.storage.index', [
            'zone' => $zone,
            'list' => 'all',
        ])->with('success', "Removed {$count} file(s) from storage.");
    }

    private function redirectToBrowser(string $zone, ?string $path, bool $listAll = false): RedirectResponse
    {
        return to_route('access.storage.index', array_filter([
            'zone' => $zone,
            'path' => $path,
            'list' => $listAll ? 'all' : null,
        ]));
    }

    private function parentPath(string $path): ?string
    {
        $path = trim(str_replace('\\', '/', $path), '/');

        if ($path === '') {
            return null;
        }

        $parent = dirname($path);

        return $parent === '.' ? null : $parent;
    }
}
