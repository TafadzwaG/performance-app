<?php

namespace App\Services\Performance\Export;

use App\Enums\CommentType;
use App\Models\Appraisal;
use App\Models\User;
use App\Support\Branding;
use App\Support\Pdf\StudioExportPdf;
use App\Support\Performance\ScoreFormatter;
use App\Support\Tenancy\TenantStoragePath;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
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
        $tempPath = TenantStoragePath::export($fileName);
        $this->ensureDirectory(dirname($tempPath));

        StudioExportPdf::configure(
            Pdf::loadView('pdf.performance.appraisal-assessment-form', $context)
        )->save($tempPath);

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
        $filePath = TenantStoragePath::export($fileName);
        $this->ensureDirectory(dirname($filePath));

        $options = new Options;
        $options->setColumnWidth(20, 1);
        $options->setColumnWidth(30, 2);
        $options->setColumnWidth(28, 3);
        $options->setColumnWidth(28, 4);
        $options->setColumnWidth(12, 5);
        $options->setColumnWidth(24, 6);
        $options->setColumnWidth(24, 7);
        $options->setColumnWidth(22, 8);
        $options->setColumnWidth(22, 9);
        $options->DEFAULT_ROW_HEIGHT = 18;

        $options->setPageSetup(new PageSetup(PageOrientation::LANDSCAPE, PaperSize::A4));

        $writer = new Writer($options);
        $writer->openToFile($filePath);
        $writer->getCurrentSheet()->setName('Appraisal');

        $this->writeAssessmentExcelHeader($writer, $context);
        $this->writeAssessmentExcelEmployee($writer, $context);
        $this->writeAssessmentExcelScoreSummary($writer, $context);
        $this->writeAssessmentExcelObjectives($writer, $context);
        $this->writeAssessmentExcelComments($writer, $context);
        $this->writeAssessmentExcelSignOff($writer);
        $this->writeAssessmentExcelRatingScales($writer, $context);
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
        $effectiveScore = $appraisal->calibrated_overall_score ?? $appraisal->overall_score;
        $effectiveRating = $appraisal->calibratedOverallRatingLevel?->label
            ?? $appraisal->overallRatingLevel?->label
            ?? 'Unrated';

        return [
            ...Branding::exportHeaderContext(),
            'appraisal' => $appraisal,
            'exportedBy' => $actor->name,
            'exportedByEmail' => $actor->email,
            'exportedAt' => Carbon::now(),
            'effectiveScore' => $effectiveScore,
            'effectiveRating' => $effectiveRating,
            'statusLabel' => Str::of((string) ($appraisal->status?->value ?? $appraisal->status))->replace('_', ' ')->title(),
            'scoreSummary' => ScoreFormatter::summaryFor($appraisal),
        ];
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

    private function writeAssessmentExcelHeader(Writer $writer, array $context): void
    {
        $titleStyle = (new Style)
            ->setFontSize(16)
            ->setFontBold()
            ->setFontColor('252627');

        $subtitleStyle = (new Style)
            ->setFontSize(10)
            ->setFontColor('5F5A4A');

        $eyebrowStyle = (new Style)
            ->setFontSize(9)
            ->setFontBold()
            ->setFontColor('8A8268');

        $writer->addRow(Row::fromValues([$context['companyName']], $titleStyle));

        if ($context['companyAddress']) {
            $writer->addRow(Row::fromValues([$context['companyAddress']], $subtitleStyle));
        }

        $writer->addRow(Row::fromValues(['§ INDIVIDUAL PERFORMANCE ASSESSMENT FORM'], $eyebrowStyle));
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

    private function writeAssessmentExcelEmployee(Writer $writer, array $context): void
    {
        $appraisal = $context['appraisal'];
        $reviewPeriod = trim(
            (optional($appraisal->reviewCycle?->start_date)->format('d M Y') ?: '').
            ' - '.
            (optional($appraisal->reviewCycle?->end_date)->format('d M Y') ?: '')
        );
        $reviewPeriod = $reviewPeriod !== '-' ? $reviewPeriod : ($appraisal->cycle_name_snapshot ?? 'Not specified');

        $this->writeTableRow($writer, [
            'Employee Name',
            $appraisal->employee_name_snapshot,
            'Job Title',
            $appraisal->job_title_name_snapshot ?: ($appraisal->employeeProfile?->jobTitle?->name ?? 'Not specified'),
        ]);
        $this->writeTableRow($writer, [
            'Department',
            $appraisal->department_name_snapshot ?: ($appraisal->employeeProfile?->department?->name ?? 'Not specified'),
            'Review Period',
            $reviewPeriod,
        ]);
        $this->writeTableRow($writer, [
            'Line Manager',
            $appraisal->lineManager?->name ?? 'Not specified',
            'Approving Manager',
            $appraisal->approvingManager?->name ?? 'Not specified',
        ]);
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeAssessmentExcelScoreSummary(Writer $writer, array $context): void
    {
        $summary = $context['scoreSummary'];

        $this->writeSectionHeading($writer, 'Score Summary');
        $this->writeTableHeader($writer, [
            'Business Score', 'Values Score', 'Overall Score', 'Final Rating',
        ]);
        $this->writeTableRow($writer, [
            $summary['business'],
            $summary['values'],
            $summary['overall'],
            $summary['rating'],
        ]);
        $this->writeTableRow($writer, ['Scorecard weights', $summary['weights'], '', '']);
        $this->writeTableRow($writer, ['Performance comment', $summary['comment'], '', '']);
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeAssessmentExcelObjectives(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, 'Business Objectives');
        $this->writeTableHeader($writer, [
            'Perspective',
            'Objective (The Goal)',
            'KPI / Measure (How Measured)',
            'Target (Success Definition)',
            'Weight',
            'Evidence Source',
            'Performance Achieved',
            'Self Rating',
            'Manager’s Rating',
        ]);

        $objectives = $context['appraisal']->objectives;
        if ($objectives->isEmpty()) {
            $this->writeTableRow($writer, ['No objectives captured.', '', '', '', '', '', '', '', '']);
        } else {
            foreach ($objectives as $objective) {
                $this->writeTableRow($writer, [
                    $objective->perspective?->name ?? 'Not specified',
                    $objective->title ?? 'Not specified',
                    $objective->kpi_measure ?? 'Not specified',
                    $objective->target_definition ?? 'Not specified',
                    $objective->weight !== null ? $objective->weight.'%' : 'Not specified',
                    $objective->evidence_source ?? 'Not specified',
                    $objective->performance_achieved ?? 'Not captured',
                    $objective->selfRatingLevel?->label ?? $objective->self_rating_score ?? 'Not rated',
                    $objective->managerRatingLevel?->label ?? $objective->manager_rating_score ?? 'Not rated',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeAssessmentExcelComments(Writer $writer, array $context): void
    {
        $appraisal = $context['appraisal'];

        $this->writeSectionHeading($writer, 'Other substantial achievements');
        $this->writeTableRow($writer, [
            $appraisal->comments
                ->where('comment_type', CommentType::AchievementNote)
                ->pluck('body')
                ->implode("\n") ?: 'No achievement comments captured.',
        ]);

        $this->writeSectionHeading($writer, 'Significant issues');
        $this->writeTableRow($writer, [
            $appraisal->comments
                ->where('comment_type', CommentType::SignificantIssue)
                ->pluck('body')
                ->implode("\n") ?: 'No significant issues captured.',
        ]);

        $this->writeSectionHeading($writer, 'Comments');
        $this->writeTableHeader($writer, ['Individual Comments', 'Manager Comments', 'Approving Manager Comments']);
        $this->writeTableRow($writer, [
            $appraisal->comments
                ->where('comment_type', CommentType::General)
                ->pluck('body')
                ->implode("\n"),
            $appraisal->objectives
                ->pluck('manager_comment')
                ->filter()
                ->implode("\n"),
            '',
        ]);
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeAssessmentExcelSignOff(Writer $writer): void
    {
        $this->writeSectionHeading($writer, 'Sign-off');
        $this->writeTableHeader($writer, ['Role', 'Name / Signature', 'Date']);
        $this->writeTableRow($writer, ['Employee', '', '']);
        $this->writeTableRow($writer, ['Manager', '', '']);
        $this->writeTableRow($writer, ['Approving Manager', '', '']);
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeAssessmentExcelRatingScales(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, 'BUSINESS OBJECTIVES RATING SCALE');
        $this->writeTableHeader($writer, ['Rating', 'Description', 'Range']);
        foreach (($context['appraisal']->template?->objectiveRatingScale?->levels ?? collect()) as $level) {
            $range = match (true) {
                $level->min_percent !== null && $level->max_percent === null => $level->min_percent.'+%',
                $level->min_percent !== null || $level->max_percent !== null => ($level->min_percent ?? '0').'% - '.$level->max_percent.'%',
                default => 'Score '.$level->value,
            };
            $this->writeTableRow($writer, [
                $level->short_label.'. '.$level->label,
                $level->description,
                $range,
            ]);
        }
        $writer->addRow(Row::fromValues(['']));

        $this->writeSectionHeading($writer, 'VALUES OBJECTIVES RATING SCALE');
        $this->writeTableHeader($writer, ['Rating', 'Description']);
        foreach (($context['appraisal']->template?->competencyRatingScale?->levels ?? collect()) as $level) {
            $this->writeTableRow($writer, [
                $level->short_label.'. '.$level->label,
                $level->description,
            ]);
        }
        $writer->addRow(Row::fromValues(['']));
    }

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
            $appraisal->business_score !== null ? ScoreFormatter::formatPercent($appraisal->business_score) : '—',
            $appraisal->values_score !== null ? ScoreFormatter::formatPercent($appraisal->values_score) : '—',
            ($context['effectiveScore'] ?? null) !== null ? ScoreFormatter::formatPercent($context['effectiveScore']) : '—',
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
            ->setFontSize(10)
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
