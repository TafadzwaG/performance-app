<?php

namespace App\Exports\Access;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class UserImportTemplateExport
{
    public function download(string $filename): BinaryFileResponse
    {
        $directory = storage_path('app/exports');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $path = $directory.DIRECTORY_SEPARATOR.$filename;

        $writer = new Writer();
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues([
            'name',
            'email',
            'password',
            'force_password_change',
            'send_credentials_email',
            'role_names',
            'permission_names',
        ]));
        $writer->addRow(Row::fromValues([
            'Rutendo Moyo',
            'rutendo.moyo@example.com',
            '',
            'yes',
            'yes',
            'Employee',
            '',
        ]));
        $writer->addRow(Row::fromValues([
            'Tawanda Chikore',
            'tawanda.chikore@example.com',
            'Welcome@1234',
            'no',
            'no',
            'Manager, Approving Manager',
            'performance.reports.view',
        ]));
        $writer->close();

        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }
}
