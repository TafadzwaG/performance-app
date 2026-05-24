<?php

namespace App\Http\Controllers\Access;

use App\Http\Controllers\Controller;
use App\Support\Branding;
use App\Support\Documentation\DocumentationLibrary;
use App\Support\Pdf\StudioExportPdf;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class HelpController extends Controller
{
    public function index(): Response
    {
        $documents = collect(DocumentationLibrary::all())
            ->map(function (array $document) {
                return [
                    'slug' => $document['slug'],
                    'title' => $document['title'],
                    'audience' => $document['audience'],
                    'category' => $document['category'],
                    'description' => $document['description'],
                    'tags' => $document['tags'],
                    'featured' => (bool) $document['featured'],
                    'formats' => collect($document['formats'])->map(
                        fn (string $format) => [
                            'format' => strtoupper($format),
                            'url' => route('access.help.download', [
                                'document' => $document['slug'],
                                'format' => $format,
                            ]),
                        ]
                    )->values()->all(),
                ];
            })
            ->values();

        return Inertia::render('access/help/Index', [
            'documents' => $documents,
            'workflowSteps' => [
                [
                    'step' => '01',
                    'title' => 'Setup Foundation',
                    'description' => 'HR and system owners configure departments, job titles, perspectives, competencies, and rating scales.',
                ],
                [
                    'step' => '02',
                    'title' => 'Employee Readiness',
                    'description' => 'Users complete their employee profile, managers are linked, and role access is assigned through permissions.',
                ],
                [
                    'step' => '03',
                    'title' => 'Cycle & Goal Planning',
                    'description' => 'Review cycles are opened, employees are assigned, and SMART objectives are agreed with correct total weighting.',
                ],
                [
                    'step' => '04',
                    'title' => 'Assessment & Review',
                    'description' => 'Employees submit self assessments, managers score business and competency performance, and send-backs are tracked.',
                ],
                [
                    'step' => '05',
                    'title' => 'Approval & Finalization',
                    'description' => 'Approving managers review, HR finalizes, audit trails are captured, and reports plus print packs become available.',
                ],
            ],
            'roleGuides' => [
                [
                    'title' => 'Employee',
                    'summary' => 'Plan goals, complete self assessment, add evidence, and track development actions.',
                ],
                [
                    'title' => 'Line Manager',
                    'summary' => 'Review team submissions, score objectives and competencies, and send appraisals forward or back.',
                ],
                [
                    'title' => 'Approving Manager',
                    'summary' => 'Approve, reject to send back, and provide final approval-stage comments.',
                ],
                [
                    'title' => 'HR Admin',
                    'summary' => 'Manage setup masters, employees, cycles, finalization, and reporting oversight.',
                ],
                [
                    'title' => 'Super Admin',
                    'summary' => 'Manage users, roles, impersonation, audit trail monitoring, and system governance.',
                ],
            ],
        ]);
    }

    public function download(string $document, string $format): BinaryFileResponse|HttpResponse
    {
        $entry = DocumentationLibrary::find($document);

        abort_unless($entry !== null, 404);
        abort_unless(in_array($format, $entry['formats'], true), 404);
        abort_unless(File::exists($entry['path']), 404);

        if ($format === 'md') {
            return response()->download($entry['path'], $entry['download_names']['md'] ?? basename($entry['path']));
        }

        if ($format === 'pdf' && str_ends_with(strtolower($entry['path']), '.pdf')) {
            return response()->download($entry['path'], $entry['download_names']['pdf'] ?? basename($entry['path']));
        }

        $markdown = File::get($entry['path']);
        $html = Str::markdown($markdown);
        $fileName = $entry['download_names']['pdf'] ?? "{$entry['slug']}.pdf";
        $user = auth()->user();

        return StudioExportPdf::configure(
            Pdf::loadView('pdf.documentation.document', [
                ...Branding::exportHeaderContext(),
                'title' => $entry['title'],
                'audience' => $entry['audience'],
                'description' => $entry['description'],
                'html' => $html,
                'headerReportLabel' => 'Documentation',
                'exportedBy' => $user?->name ?? 'System',
                'exportedByEmail' => $user?->email,
                'exportedAt' => now(),
            ])
        )->download($fileName);
    }
}
