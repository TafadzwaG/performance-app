<?php

namespace App\Exports\Performance;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmployeeImportTemplateExport
{
    public function download(string $filename): BinaryFileResponse
    {
        $directory = storage_path('app/exports');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory.DIRECTORY_SEPARATOR.$filename;

        $writer = new Writer;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues([
            'user_email',
            'employee_number',
            'department_name',
            'job_title_name',
            'line_manager_email',
            'approving_manager_email',
            'national_id',
            'date_of_birth',
            'gender',
            'marital_status',
            'personal_phone',
            'employment_status',
            'employment_type',
            'work_location',
            'hire_date',
            'is_active',
            'is_review_eligible',
            'role_names',
        ]));
        $writer->addRow(Row::fromValues([
            'rutendo.moyo@example.com',
            'EMP-1001',
            'Human Resources',
            'HR Officer',
            'manager@example.com',
            'approver@example.com',
            'ID-1001',
            '1992-05-14',
            'female',
            'married',
            '+27110000001',
            'active',
            'permanent',
            'Harare Office',
            '2022-01-15',
            'yes',
            'yes',
            'Employee',
        ]));
        $writer->close();

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }
}
