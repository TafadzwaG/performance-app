<?php

namespace App\Http\Controllers\Performance\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Performance\Setup\StorePerspectiveRequest;
use App\Http\Requests\Performance\Setup\UpdatePerspectiveRequest;
use App\Models\Perspective;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerspectiveController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Perspective::class, 'perspective');
    }

    public function index(Request $request): Response
    {
        $search = (string) $request->string('search');

        $perspectives = Perspective::query()
            ->when($search, fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->orderBy('sort_order')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('performance/setup/perspectives/Index', [
            'perspectives' => $perspectives,
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('performance.setup.perspectives.create'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('performance/setup/perspectives/Create');
    }

    public function store(StorePerspectiveRequest $request): RedirectResponse
    {
        Perspective::create($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return to_route('performance.setup.perspectives.index');
    }

    public function edit(Perspective $perspective): Response
    {
        return Inertia::render('performance/setup/perspectives/Edit', [
            'perspective' => $perspective,
        ]);
    }

    public function update(UpdatePerspectiveRequest $request, Perspective $perspective): RedirectResponse
    {
        $perspective->update($request->validated() + [
            'is_active' => (bool) $request->boolean('is_active'),
        ]);

        return to_route('performance.setup.perspectives.index');
    }

    public function destroy(Perspective $perspective): RedirectResponse
    {
        $perspective->delete();

        return to_route('performance.setup.perspectives.index');
    }
}
