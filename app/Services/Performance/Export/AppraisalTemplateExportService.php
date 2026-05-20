<?php

namespace App\Services\Performance\Export;

use App\Models\AppraisalTemplate;
use App\Models\SystemSetting;
use App\Models\User;
use App\Support\Branding;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
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
 * Branded export pipeline for an AppraisalTemplate — mirrors the
 * AppraisalExportService so both deliverables share the same look & feel.
 */
class AppraisalTemplateExportService
{
    /* ============================================================== PDF */

    public function pdf(AppraisalTemplate $template, User $actor): BinaryFileResponse
    {
        $context = $this->buildContext($this->loadTemplate($template), $actor);

        $fileName = $this->fileName($context['template'], 'pdf');
        $tempPath = storage_path('app/exports/'.$fileName);
        $this->ensureDirectory(dirname($tempPath));

        Pdf::loadView('pdf.performance.template-export', $context)
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

    public function excel(AppraisalTemplate $template, User $actor): BinaryFileResponse
    {
        $context = $this->buildContext($this->loadTemplate($template), $actor);

        $fileName = $this->fileName($context['template'], 'xlsx');
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
        $options->DEFAULT_ROW_HEIGHT = 18;
        $options->setPageSetup(new PageSetup(PageOrientation::LANDSCAPE, PaperSize::A4));

        $writer = new Writer($options);
        $writer->openToFile($filePath);
        $writer->getCurrentSheet()->setName('Template');

        $this->writeHeader($writer, $context);
        $this->writeOverview($writer, $context);
        $this->writeRatingScales($writer, $context);
        $this->writeObjectiveItems($writer, $context);
        $this->writeValueItems($writer, $context);
        $this->writeFooter($writer, $context);

        $writer->close();

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /* ========================================================== Loading */

    private function loadTemplate(AppraisalTemplate $template): AppraisalTemplate
    {
        return $template->loadMissing([
            'department',
            'jobTitle',
            'objectiveRatingScale.levels',
            'competencyRatingScale.levels',
            'overallRatingScale.levels',
            'items.perspective',
            'items.competency',
        ]);
    }

    private function buildContext(AppraisalTemplate $template, User $actor): array
    {
        $settings = SystemSetting::query()->first();
        $logoPath = $this->logoAbsolutePath();
        $poweredByPath = Branding::poweredByPath();

        $items = $template->items;
        $objectiveItems = $items->filter(fn ($i) => $this->itemType($i) === 'objective')->values();
        $valueItems = $items->filter(fn ($i) => $this->itemType($i) === 'competency')->values();

        return [
            'template' => $template,
            'objectiveItems' => $objectiveItems,
            'valueItems' => $valueItems,
            'totalWeight' => (float) $objectiveItems->sum(fn ($i) => (float) ($i->default_weight ?? 0)),
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
        ];
    }

    private function itemType($item): string
    {
        $type = $item->item_type;
        if (is_object($type) && property_exists($type, 'value')) {
            return (string) $type->value;
        }

        return (string) $type;
    }

    private function logoAbsolutePath(): ?string
    {
        $files = glob(public_path('branding/system-logo.*')) ?: [];

        return $files[0] ?? null;
    }

    private function fileName(AppraisalTemplate $template, string $extension): string
    {
        $code = $template->code ?: 'template';
        $version = 'v'.($template->version ?: 1);
        $timestamp = Carbon::now()->format('Ymd-His');

        return "appraisal-template-{$code}-{$version}-{$timestamp}.{$extension}";
    }

    private function ensureDirectory(string $directory): void
    {
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
    }

    /* ================================================== Excel sections */

    private function writeHeader(Writer $writer, array $context): void
    {
        $titleStyle = (new Style)->setFontSize(18)->setFontBold()->setFontColor('252627');
        $subtitleStyle = (new Style)->setFontSize(11)->setFontColor('5F5A4A');
        $eyebrowStyle = (new Style)->setFontSize(9)->setFontBold()->setFontColor('8A8268');

        $writer->addRow(Row::fromValues([$context['companyName']], $titleStyle));
        if ($context['companyAddress']) {
            $writer->addRow(Row::fromValues([$context['companyAddress']], $subtitleStyle));
        }
        $writer->addRow(Row::fromValues(['§ APPRAISAL TEMPLATE'], $eyebrowStyle));
        $writer->addRow(Row::fromValues([
            sprintf(
                '%s   |   Code: %s   |   Version: v%s   |   Status: %s',
                $context['template']->name,
                $context['template']->code ?? '—',
                $context['template']->version ?? 1,
                $context['template']->is_active ? 'Active' : 'Inactive',
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

    private function writeOverview(Writer $writer, array $context): void
    {
        $template = $context['template'];
        $this->writeSectionHeading($writer, '§ Overview');

        $labelStyle = (new Style)->setFontBold()->setFontColor('252627');
        $rows = [
            ['Description', $template->description ?? '—'],
            ['Department scope', $template->department?->name ?? 'All departments'],
            ['Job title scope', $template->jobTitle?->name ?? 'All job titles'],
            ['Business weight', ($template->business_weight_percent ?? 0).'%'],
            ['Values weight', ($template->values_weight_percent ?? 0).'%'],
            ['Goal range', ($template->min_objectives ?? 0).' – '.($template->max_objectives ?? 0)],
            ['Allow values', $template->allow_competencies ? 'Yes' : 'No'],
            ['Total goal weight', number_format($context['totalWeight'], 2).'%'],
        ];

        foreach ($rows as [$label, $value]) {
            $writer->addRow(Row::fromValues([$label, $this->scalar($value)], $labelStyle));
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeRatingScales(Writer $writer, array $context): void
    {
        $template = $context['template'];

        $scales = [
            'Objective Scale' => $template->objectiveRatingScale,
            'Values Scale' => $template->competencyRatingScale,
            'Overall Scale' => $template->overallRatingScale,
        ];

        foreach ($scales as $label => $scale) {
            $this->writeSectionHeading($writer, "§ {$label}");
            if (! $scale) {
                $this->writeTableRow($writer, ['Not configured', '', '', '']);
                $writer->addRow(Row::fromValues(['']));

                continue;
            }
            $this->writeTableRow($writer, [
                'Scale',
                $scale->name.' ('.$scale->code.')',
                '',
                '',
            ]);
            $this->writeTableHeader($writer, ['Short', 'Label', 'Value', 'Range']);
            $levels = $scale->levels->sortBy('sort_order');
            if ($levels->isEmpty()) {
                $this->writeTableRow($writer, ['—', 'No levels defined.', '—', '—']);
            } else {
                foreach ($levels as $level) {
                    $range = ($level->min_percent !== null || $level->max_percent !== null)
                        ? ($level->min_percent ?? '—').'% – '.($level->max_percent ?? '—').'%'
                        : '—';
                    $this->writeTableRow($writer, [
                        $level->short_label ?? '—',
                        $level->label ?? '—',
                        $level->value ?? '—',
                        $range,
                    ]);
                }
            }
            $writer->addRow(Row::fromValues(['']));
        }
    }

    private function writeObjectiveItems(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Objective Items');
        $this->writeTableHeader($writer, ['#', 'Perspective', 'Title', 'Description', 'Weight', 'Required', 'Evidence Hint']);

        if ($context['objectiveItems']->isEmpty()) {
            $this->writeTableRow($writer, ['—', '—', 'No objective items configured.', '', '', '', '']);
        } else {
            foreach ($context['objectiveItems'] as $i => $item) {
                $this->writeTableRow($writer, [
                    $i + 1,
                    $item->perspective?->name ?? '—',
                    $item->title ?? '—',
                    $item->description ?? '—',
                    ($item->default_weight !== null ? $item->default_weight.'%' : '—'),
                    $item->is_required ? 'Yes' : 'No',
                    $item->evidence_source_hint ?? '—',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeValueItems(Writer $writer, array $context): void
    {
        $this->writeSectionHeading($writer, '§ Values / Behaviour Items');
        $this->writeTableHeader($writer, ['#', 'Value', 'Title', 'Description', 'Required']);

        if ($context['valueItems']->isEmpty()) {
            $this->writeTableRow($writer, ['—', '—', 'No values items configured.', '', '']);
        } else {
            foreach ($context['valueItems'] as $i => $item) {
                $this->writeTableRow($writer, [
                    $i + 1,
                    $item->competency?->name ?? '—',
                    $item->title ?? '—',
                    $item->description ?? '—',
                    $item->is_required ? 'Yes' : 'No',
                ]);
            }
        }
        $writer->addRow(Row::fromValues(['']));
    }

    private function writeFooter(Writer $writer, array $context): void
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

    /* ============================================== Style helpers */

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
}
