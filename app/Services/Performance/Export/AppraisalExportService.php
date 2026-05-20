<?php

namespace App\Services\Performance\Export;

use App\Models\Appraisal;
use App\Models\SystemSetting;
use App\Models\User;
use App\Support\Branding;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
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

/**
 * Produces branded landscape PDF and structured XLSX exports of an Appraisal
 * at any stage of its lifecycle. Both formats share the same data assembly
 * pipeline so the artifacts stay consistent.
 */
class AppraisalExportService
{
    /* =============================================================== PDF */

    public function pdf(Appraisal $appraisal, User $actor): BinaryFileResponse
    {
        $appraisal = $this->loadAppraisal($appraisal);
        $context = $this->buildContext($appraisal, $actor);

        $fileName = $this->fileName($appraisal, 'pdf');
        $tempPath = storage_path('app/exports/'.$fileName);
        $this->ensureDirectory(dirname($tempPath));

        Pdf::loadView('pdf.performance.appraisal-export', $context)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ])
            ->save($tempPath);

        return response()->download($tempPath, $fileName, [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    /* ============================================================ EXCEL */

    public function excel(Appraisal $appraisal, User $actor): BinaryFileResponse
    {
        $appraisal = $this->loadAppraisal($appraisal);
        $context = $this->buildContext($appraisal, $actor);

        $fileName = $this->fileName($appraisal, 'xlsx');
        $filePath = storage_path('app/exports/'.$fileName);
        $this->ensureDirectory(dirname($filePath));

        $options = new Options;
        $options->setColumnWidth(28, 1);
        $options->setColumnWidth(40, 2);
        $options->setColumnWidth(20, 3);
        $options->setColumnWidth(20, 4);
        $options->setColumnWidth(20, 5);
        $options->setColumnWidth(20, 6);
        $options->setColumnWidth(20, 7);
        $options->setColumnWidth(20, 8);
        $options->DEFAULT_ROW_HEIGHT = 18;

        // Landscape page setup makes printing & PDF-from-Excel nice.
        $options->setPageSetup(new PageSetup(PageOrientation::LANDSCAPE, PaperSize::A4));

        $writer = new Writer($options);
        $writer->openToFile($filePath);
        $writer->getCurrentSheet()->setName('Appraisal');

        $this->writeExcelHeader($writer, $context);
        $this->writeExcelEmployee($writer, $context);
        $this->writeExcelScores($writer, $context);
        $this->writeExcelObjectives($writer, $context);
        $this->writeExcelValues($writer, $context);
        $this->writeExcelComments($writer, $context);
        $this->writeExcelApprovals($writer, $context);
        $this->writeExcelHistory($writer, $context);
        $this->writeExcelDevelopmentPlan($writer, $context);
        $this->writeExcelFooter($writer, $context);

        $writer->close();

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /* ========================================================= Loading */

    private function loadAppraisal(Appraisal $appraisal): Appraisal
    {
        return $appraisal->loadMissing([
            'reviewCycle',
            'lineManager',
            'approvingManager',
            'employeeProfile.department',
            'employeeProfile.jobTitle',
            'template.objectiveRatingScale.levels',
            'template.competencyRatingScale.levels',
            'template.overallRatingScale.levels',
            'objectives.perspective',
            'objectives.selfRatingLevel',
            'objectives.managerRatingLevel',
            'competencyRatings.competency',
            'competencyRatings.selfRatingLevel',
            'competencyRatings.managerRatingLevel',
            'comments.author',
            'approvals.actor',
            'statusHistories.actor',
            'developmentPlan.actions.owner',
            'overallRatingLevel',
            'calibratedOverallRatingLevel',
            'latestCalibration.actor',
            'latestCalibration.calibratedOverallRatingLevel',
            'latestCalibration.originalOverallRatingLevel',
        ]);
    }

    private function buildContext(Appraisal $appraisal, User $actor): array
    {
        $settings = SystemSetting::query()->first();
        $logoPath = $this->logoAbsolutePath();
        $effectiveScore = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;
        $effectiveRating = $appraisal->calibratedOverallRatingLevel?->label
            ?? $appraisal->overallRatingLevel?->label
            ?? 'Unrated';

        $poweredByPath = Branding::poweredByPath();

        return [
            'appraisal' => $appraisal,
            'settings' => $settings,
            'logoPath' => $logoPath,
            'logoExists' => $logoPath !== null && File::exists($logoPath),
            'poweredByPath' => $poweredByPath,
            'poweredByExists' => $poweredByPath !== null,
            'companyName' => $settings?->company_name ?? 'Performance Appraisal Studio',
            'companyAddress' => $settings?->formattedAddress(),
            'reportFooter' => $settings?->report_footer,
            'exportedBy' => $actor->name,
            'exportedByEmail' => $actor->email,
            'exportedAt' => Carbon::now(),
            'effectiveScore' => $effectiveScore,
            'effectiveRating' => $effectiveRating,
            'statusLabel' => Str::of((string) ($appraisal->status?->value ?? $appraisal->status))->replace('_', ' ')->title(),
        ];
    }

    private function logoAbsolutePath(): ?string
    {
        $files = glob(public_path('branding/system-logo.*')) ?: [];

        return $files[0] ?? null;
    }

    private function fileName(Appraisal $appraisal, string $extension): string
    {
        $number = $appraisal->employee_number_snapshot ?: 'employee';
        $cycle = $appraisal->reviewCycle?->code ?? $appraisal->review_cycle_id;
        $stage = Str::slug((string) ($appraisal->status?->value ?? $appraisal->status));
        $timestamp = Carbon::now()->format('Ymd-His');

        return "appraisal-{$number}-{$cycle}-{$stage}-{$timestamp}.{$extension}";
    }

    private function ensureDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }

    /* =================================================== Excel sections */

    private function writeExcelHeader(Writer $writer, array $context): void
    {
        $titleStyle = (new Style)
            ->setFontSize(18)
            ->setFontBold()
            ->setFontColor('252627');

        $eyebrowStyle = (new Style)
            ->setFontSize(9)
            ->setFontBold()
            ->setFontColor('8A8268');

        $subtitleStyle = (new Style)
            ->setFontSize(11)
            ->setFontColor('5F5A4A');

        $writer->addRow(Row::fromValues([$context['companyName']], $titleStyle));
        if ($context['companyAddress']) {
            $writer->addRow(Row::fromValues([$context['companyAddress']], $subtitleStyle));
        }
        $writer->addRow(Row::fromValues(['§ EMPLOYEE PERFORMANCE APPRAISAL'], $eyebrowStyle));
        $writer->addRow(Row::fromValues([
            sprintf(
                'Cycle: %s   |   Template: %s   |   Status: %s',
                $context['appraisal']->cycle_name_snapshot,
                $context['appraisal']->template_name_snapshot,
                $context['statusLabel'],
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

    private function writeExcelEmployee(Writer $writer, array $context): void
    {
        $appraisal = $context['appraisal'];

        $this->writeSectionHeading($writer, '§ Employee');
        $rows = [
            ['Name', $appraisal->employee_name_snapshot],
            ['Email', $appraisal->employee_email_snapshot],
            ['Employee Number', $appraisal->employee_number_snapshot],
            ['Department', $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? '—')],
            ['Job Title', $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? '—')],
            ['Line Manager', $appraisal->lineManager?->name ?? '—'],
            ['Approving Manager', $appraisal->approvingManager?->name ?? '—'],
        ];

        $labelStyle = (new Style)->setFontBold()->setFontColor('252627');
        foreach ($rows as [$label, $value]) {
            $writer->addRow(Row::fromValues([$label, $value], $labelStyle));
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeExcelScores(Writer $writer, array $context): void
    {
        $appraisal = $context['appraisal'];

        $this->writeSectionHeading($writer, '§ Score Summary');
        $this->writeTableHeader($writer, [
            'Business Score', 'Values Score', 'Overall Score', 'Final Rating',
        ]);
        $this->writeTableRow($writer, [
            $appraisal->business_score ?? '—',
            $appraisal->values_score ?? '—',
            $context['effectiveScore'] ?? '—',
            $context['effectiveRating'],
        ]);
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeExcelObjectives(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Objectives');
        $this->writeTableHeader($writer, [
            'Perspective', 'Objective', 'KPI / Measure', 'Target', 'Weight', 'Achieved', 'Self Rating', 'Manager Rating',
        ]);

        $objectives = $context['appraisal']->objectives;
        if ($objectives->isEmpty()) {
            $this->writeTableRow($writer, ['No objectives captured.', '', '', '', '', '', '', '']);
        } else {
            foreach ($objectives as $objective) {
                $this->writeTableRow($writer, [
                    $objective->perspective?->name ?? '—',
                    trim(($objective->title ?? '—').($objective->employee_comment ? "\n".$objective->employee_comment : '')),
                    $objective->kpi_measure ?? '—',
                    $objective->target_definition ?? '—',
                    $objective->weight ?? '—',
                    $objective->performance_achieved ?? '—',
                    $objective->selfRatingLevel?->label ?? $objective->self_rating_score ?? '—',
                    $objective->managerRatingLevel?->label ?? $objective->manager_rating_score ?? '—',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeExcelValues(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Values');
        $this->writeTableHeader($writer, [
            'Value', 'Self Rating', 'Manager Rating', 'Employee Comment', 'Manager Comment',
        ]);

        $ratings = $context['appraisal']->competencyRatings;
        if ($ratings->isEmpty()) {
            $this->writeTableRow($writer, ['No value ratings captured.', '', '', '', '']);
        } else {
            foreach ($ratings as $rating) {
                $this->writeTableRow($writer, [
                    $rating->competency?->name ?? '—',
                    $rating->selfRatingLevel?->label ?? $rating->self_rating_score ?? '—',
                    $rating->managerRatingLevel?->label ?? $rating->manager_rating_score ?? '—',
                    $rating->employee_comment ?? '—',
                    $rating->manager_comment ?? '—',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeExcelComments(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Comments');
        $this->writeTableHeader($writer, ['Type', 'Author', 'Comment']);

        $comments = $context['appraisal']->comments;
        if ($comments->isEmpty()) {
            $this->writeTableRow($writer, ['No comments captured.', '', '']);
        } else {
            foreach ($comments as $comment) {
                $this->writeTableRow($writer, [
                    Str::of((string) ($comment->comment_type?->value ?? $comment->comment_type))->replace('_', ' ')->title(),
                    $comment->author?->name ?? 'System',
                    $comment->body ?? '—',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeExcelApprovals(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Approvals');
        $this->writeTableHeader($writer, ['Stage', 'Action', 'Actor', 'Acted At', 'Comments']);

        $approvals = $context['appraisal']->approvals;
        if ($approvals->isEmpty()) {
            $this->writeTableRow($writer, ['No approval actions captured.', '', '', '', '']);
        } else {
            foreach ($approvals as $approval) {
                $this->writeTableRow($writer, [
                    Str::of((string) ($approval->stage?->value ?? $approval->stage))->replace('_', ' ')->title(),
                    Str::of((string) ($approval->action?->value ?? $approval->action))->replace('_', ' ')->title(),
                    $approval->actor?->name ?? 'System',
                    optional($approval->acted_at)->format('d M Y H:i') ?? '—',
                    $approval->comments ?? '—',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeExcelHistory(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Status History');
        $this->writeTableHeader($writer, ['From', 'To', 'Actor', 'Reason', 'Recorded At']);

        $history = $context['appraisal']->statusHistories;
        if ($history->isEmpty()) {
            $this->writeTableRow($writer, ['No transitions recorded.', '', '', '', '']);
        } else {
            foreach ($history as $entry) {
                $this->writeTableRow($writer, [
                    (string) (Str::of((string) ($entry->from_status?->value ?? $entry->from_status))->replace('_', ' ')->title() ?: '—'),
                    (string) (Str::of((string) ($entry->to_status?->value ?? $entry->to_status))->replace('_', ' ')->title() ?: '—'),
                    $entry->actor?->name ?? 'System',
                    $entry->reason ?? '—',
                    optional($entry->created_at)->format('d M Y H:i') ?? '—',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeExcelDevelopmentPlan(Writer $writer, array $context): void
    {
        $plan = $context['appraisal']->developmentPlan;

        $this->writeSectionHeading($writer, '§ Development Plan');
        $labelStyle = (new Style)->setFontBold();
        $writer->addRow(Row::fromValues(['Strengths', $plan?->strengths ?? '—'], $labelStyle));
        $writer->addRow(Row::fromValues(['Improvement Areas', $plan?->improvement_areas ?? '—'], $labelStyle));
        $writer->addRow(Row::fromValues(['Follow Up Notes', $plan?->follow_up_notes ?? '—'], $labelStyle));
        $writer->addRow(Row::fromValues(['']));

        $this->writeTableHeader($writer, ['Action', 'Owner', 'Due Date', 'Status', 'Follow Up']);
        $actions = $plan?->actions ?? collect();
        if ($actions->isEmpty()) {
            $this->writeTableRow($writer, ['No development actions captured.', '', '', '', '']);
        } else {
            foreach ($actions as $action) {
                $this->writeTableRow($writer, [
                    $action->action ?? '—',
                    $action->owner?->name ?? '—',
                    optional($action->due_date)->format('d M Y') ?? '—',
                    $this->scalar($action->status),
                    $this->scalar($action->follow_up_status),
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    /**
     * Normalize enum-or-string values into a plain string so openspout's
     * scalar-only row API doesn't blow up on backed enums.
     */
    private function scalar(mixed $value): string
    {
        if ($value === null) {
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

    private function writeExcelFooter(Writer $writer, array $context): void
    {
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

    /* ============================================== Excel style helpers */

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

        $writer->addRow(Row::fromValues(array_map(fn ($v) => $this->scalar($v), $values), $style));
    }
}
