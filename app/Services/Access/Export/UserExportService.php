<?php

namespace App\Services\Access\Export;

use App\Models\User;
use App\Support\Access\UserExportColumnRegistry;
use App\Support\Branding;
use App\Support\Pdf\StudioExportPdf;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Border;
use OpenSpout\Common\Entity\Style\BorderPart;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Options\PageOrientation;
use OpenSpout\Writer\XLSX\Options\PageSetup;
use OpenSpout\Writer\XLSX\Options\PaperSize;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class UserExportService
{
    private const REPORT_TITLE = 'IT User Access List';

    public function excel(Collection $rows, User $actor, array $columns, array $filters = []): BinaryFileResponse
    {
        $context = $this->buildContext($rows, $actor, $columns, $filters);

        $fileName = $this->fileName('xlsx');
        $filePath = storage_path('app/exports/'.$fileName);
        $this->ensureDirectory(dirname($filePath));

        $options = new Options;
        $options->setColumnWidth(22, 1);
        $options->setColumnWidth(30, 2);
        $options->setColumnWidth(24, 3);
        $options->setColumnWidth(28, 4);
        $options->setColumnWidth(20, 5);
        $options->setColumnWidth(36, 6);
        $options->DEFAULT_ROW_HEIGHT = 18;
        $options->setPageSetup(new PageSetup(PageOrientation::LANDSCAPE, PaperSize::A4));

        $writer = new Writer($options);
        $writer->openToFile($filePath);
        $writer->getCurrentSheet()->setName('User Access');

        $this->writeHeader($writer, $context);
        $this->writeFilterSummary($writer, $context);
        $this->writeSummaryCounters($writer, $context);
        $this->writeUserDirectory($writer, $context);
        $this->writeFooter($writer, $context);

        $writer->close();

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function pdf(Collection $rows, User $actor, array $columns, array $filters = []): BinaryFileResponse
    {
        $context = $this->buildContext($rows, $actor, $columns, $filters);

        $fileName = $this->fileName('pdf');
        $tempPath = storage_path('app/exports/'.$fileName);
        $this->ensureDirectory(dirname($tempPath));

        StudioExportPdf::configure(
            Pdf::loadView('pdf.access.user-access-list', $context)
        )->save($tempPath);

        return response()->download($tempPath, $fileName, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    private function buildContext(Collection $rows, User $actor, array $columns, array $filters): array
    {
        $branding = Branding::exportHeaderContext();
        $approvalStatus = $filters['approval_status'] ?? 'active';

        return [
            'rows' => $rows,
            'columns' => $columns,
            'filters' => $filters,
            'headings' => UserExportColumnRegistry::labelsFor($columns),
            'tableRows' => $this->tableRows($rows, $columns),
            'branding' => $branding,
            'companyName' => $branding['companyName'],
            'companyAddress' => $branding['companyAddress'],
            'reportFooter' => $branding['reportFooter'],
            'reportTitle' => self::REPORT_TITLE,
            'exportedBy' => $actor->name,
            'exportedByEmail' => $actor->email,
            'exportedAt' => Carbon::now(),
            'totalRows' => $rows->count(),
            'summary' => [
                'total' => $rows->count(),
                'approvalScope' => $approvalStatus === 'pending' ? 'Pending approvals' : 'Active users',
                'withRoles' => $rows->filter(fn (User $user) => $user->roles->isNotEmpty())->count(),
                'withDirectPermissions' => $rows->filter(fn (User $user) => $user->permissions->isNotEmpty())->count(),
            ],
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function tableRows(Collection $rows, array $columns): array
    {
        if ($rows->isEmpty()) {
            $emptyRow = array_fill(0, count($columns), '—');
            $emptyRow[0] = 'No users matched the selected filters.';

            return [$emptyRow];
        }

        return $rows
            ->map(function (User $user) use ($columns) {
                return collect($columns)
                    ->map(fn (string $column) => $this->scalar(UserExportColumnRegistry::value($user, $column)))
                    ->all();
            })
            ->all();
    }

    private function fileName(string $extension): string
    {
        return 'it-user-access-list-'.Carbon::now()->format('Ymd-Hi').'.'.$extension;
    }

    private function ensureDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }

    private function writeHeader(Writer $writer, array $context): void
    {
        $titleStyle = (new Style)->setFontSize(18)->setFontBold()->setFontColor('252627');
        $subtitleStyle = (new Style)->setFontSize(11)->setFontColor('5F5A4A');
        $eyebrowStyle = (new Style)->setFontSize(9)->setFontBold()->setFontColor('8A8268');

        $writer->addRow(Row::fromValues([$context['companyName']], $titleStyle));

        if ($context['companyAddress']) {
            $writer->addRow(Row::fromValues([$context['companyAddress']], $subtitleStyle));
        }

        $writer->addRow(Row::fromValues(['§ '.strtoupper(self::REPORT_TITLE)], $eyebrowStyle));
        $writer->addRow(Row::fromValues([
            sprintf(
                'Application user access report   |   %d user%s exported',
                $context['totalRows'],
                $context['totalRows'] === 1 ? '' : 's',
            ),
        ], $subtitleStyle));
        $writer->addRow(Row::fromValues([
            sprintf(
                'Exported by %s (%s) at %s',
                $context['exportedBy'],
                $context['exportedByEmail'],
                $context['exportedAt']->format('d M Y H:i'),
            ),
        ], $subtitleStyle));
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeFilterSummary(Writer $writer, array $context): void
    {
        $filters = $context['filters'];
        $hasFilters = collect($filters)->filter(fn ($value) => filled($value))->isNotEmpty();

        $this->writeSectionHeading($writer, '§ Export Filters');

        $labelStyle = (new Style)->setFontBold()->setFontColor('252627');
        $approvalStatus = $filters['approval_status'] ?? 'active';
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDirection = strtoupper($filters['sort_dir'] ?? 'asc');

        $summaryRows = [
            ['Search', filled($filters['search'] ?? null) ? $filters['search'] : 'All users'],
            ['Approval Status', $approvalStatus === 'pending' ? 'Pending approvals' : 'Active users'],
            ['Role', $filters['role'] ?? 'All roles'],
            ['Department', $filters['department'] ?? 'All departments'],
            ['Employee Profile', $filters['employee_link'] ?? 'All profile states'],
            ['Direct Permissions', $filters['has_direct_permissions'] ?? 'All permission states'],
            ['Sort By', Str::of($sortBy)->replace('_', ' ')->title()->toString()],
            ['Sort Direction', $sortDirection],
        ];

        foreach ($summaryRows as [$label, $value]) {
            $writer->addRow(Row::fromValues([$label, $this->scalar($value)], $labelStyle));
        }

        if (! $hasFilters) {
            $writer->addRow(Row::fromValues([
                'Note',
                'No additional filters were applied. This export includes all users for the selected approval status.',
            ], $labelStyle));
        }

        $writer->addRow(Row::fromValues(['']));
    }

    private function writeSummaryCounters(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Summary');

        $labelStyle = (new Style)->setFontBold()->setFontColor('252627');
        $summary = $context['summary'];

        foreach ([
            ['Total Users', $summary['total']],
            ['Scope', $summary['approvalScope']],
            ['Users With Roles', $summary['withRoles']],
            ['Users With Direct Permissions', $summary['withDirectPermissions']],
        ] as [$label, $value]) {
            $writer->addRow(Row::fromValues([$label, $this->scalar($value)], $labelStyle));
        }

        $writer->addRow(Row::fromValues(['']));
    }

    private function writeUserDirectory(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ '.self::REPORT_TITLE);

        $this->writeTableHeader($writer, $context['headings']);

        foreach ($context['tableRows'] as $values) {
            $this->writeTableRow($writer, $values);
        }
    }

    private function writeFooter(Writer $writer, array $context): void
    {
        $writer->addRow(Row::fromValues(['']));

        $footerStyle = (new Style)
            ->setFontSize(9)
            ->setFontItalic()
            ->setFontColor('8A8268');

        if ($context['reportFooter']) {
            $writer->addRow(Row::fromValues([$context['reportFooter']], $footerStyle));
        }

        $writer->addRow(Row::fromValues([
            sprintf(
                'Generated by %s on %s.',
                $context['exportedBy'],
                $context['exportedAt']->format('d M Y H:i'),
            ),
        ], $footerStyle));
    }

    private function writeSectionHeading(Writer $writer, string $label): void
    {
        $style = (new Style)
            ->setFontBold()
            ->setFontSize(12)
            ->setFontColor('252627')
            ->setBackgroundColor('F3EEDD');

        $writer->addRow(Row::fromValues([$label], $style));
    }

    private function writeTableHeader(Writer $writer, array $headings): void
    {
        $style = (new Style)
            ->setFontBold()
            ->setFontColor('FFFFFF')
            ->setBackgroundColor('252627')
            ->setBorder(new Border(
                new BorderPart(Border::TOP, Color::BLACK, Border::WIDTH_THIN, Border::STYLE_SOLID),
                new BorderPart(Border::BOTTOM, Color::BLACK, Border::WIDTH_THIN, Border::STYLE_SOLID),
            ));

        $writer->addRow(Row::fromValues($headings, $style));
    }

    private function writeTableRow(Writer $writer, array $values): void
    {
        $style = (new Style)
            ->setShouldWrapText()
            ->setBorder(new Border(
                new BorderPart(Border::TOP, 'BFB48F', Border::WIDTH_THIN, Border::STYLE_SOLID),
                new BorderPart(Border::BOTTOM, 'BFB48F', Border::WIDTH_THIN, Border::STYLE_SOLID),
            ));

        $writer->addRow(Row::fromValues($values, $style));
    }

    private function scalar(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '—';
        }

        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        if ($value instanceof \UnitEnum) {
            return $value->name;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('d M Y H:i');
        }

        return (string) $value;
    }
}
