<?php

namespace App\Exports\Performance;

use App\Support\Tenancy\TenantStoragePath;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GoalLibraryImportTemplateExport
{
    public function download(string $filename): BinaryFileResponse
    {
        $directory = TenantStoragePath::exportDirectory();

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory.DIRECTORY_SEPARATOR.$filename;

        $writer = new Writer;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues([
            'perspective',
            'objective',
            'kpi_measure',
            'target_definition',
            'weight',
            'evidence_source',
            'department_name',
            'job_title_name',
            'is_active',
        ]));
        $writer->addRow(Row::fromValues([
            'Financial',
            'Maximize room revenue',
            'Average Daily Rate',
            'Achieve ADR of 150',
            '20',
            'PMS Report',
            'Front Office',
            'Front Office Manager',
            'yes',
        ]));
        $writer->addRow(Row::fromValues([
            'Customer',
            'Deliver exceptional arrival experience',
            'Guest Satisfaction Score',
            'Maintain 95% positive score',
            '25',
            'Feedback System',
            'Front Office',
            'Front Office Manager',
            'yes',
        ]));
        $writer->close();

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }
}
