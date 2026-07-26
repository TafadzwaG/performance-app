<?php

namespace App\Exports\Performance;

use App\Support\Tenancy\TenantStoragePath;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmployeeImportTemplateExport
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
            'employee_number',
            'user_email',
            'department_name',
            'job_title_name',
            'location_code',
            'line_manager_employee_number',
            'approving_manager_employee_number',
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
            'EMP-1001',
            'rutendo.moyo@example.com',
            'Human Resources',
            'HR Officer',
            'MAIN',
            'MGR-2001',
            'APR-3001',
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
