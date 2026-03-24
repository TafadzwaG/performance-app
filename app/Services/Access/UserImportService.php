<?php

namespace App\Services\Access;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\ODS\Reader as OdsReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

class UserImportService
{
    public function parse(UploadedFile $file, array $defaults = []): array
    {
        $rows = $this->readRows($file);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => ['The import file does not contain any user rows.'],
            ]);
        }

        $roleMap = Role::query()->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [Str::lower((string) $name) => $id])
            ->all();
        $permissionMap = Permission::query()->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [Str::lower((string) $name) => $id])
            ->all();

        $normalized = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $name = trim((string) ($row['name'] ?? ''));
            $email = trim((string) ($row['email'] ?? ''));

            if ($name === '' && $email === '') {
                continue;
            }

            [$roleIds, $missingRoles] = $this->resolveNames($row['role_names'] ?? '', $roleMap);
            [$permissionIds, $missingPermissions] = $this->resolveNames($row['permission_names'] ?? '', $permissionMap);

            if ($missingRoles !== []) {
                $errors[] = 'Row '.$line.' has unknown roles: '.implode(', ', $missingRoles).'.';
            }

            if ($missingPermissions !== []) {
                $errors[] = 'Row '.$line.' has unknown permissions: '.implode(', ', $missingPermissions).'.';
            }

            $normalized[] = [
                'name' => $name,
                'email' => $email,
                'password' => trim((string) ($row['password'] ?? '')),
                'send_credentials_email' => $this->resolveBoolean(
                    $row['send_credentials_email'] ?? null,
                    Arr::get($defaults, 'send_credentials_email', true),
                ),
                'force_password_change' => $this->resolveBoolean(
                    $row['force_password_change'] ?? null,
                    Arr::get($defaults, 'force_password_change', true),
                ),
                'role_ids' => $roleIds !== [] ? $roleIds : Arr::get($defaults, 'role_ids', []),
                'permission_ids' => $permissionIds !== [] ? $permissionIds : Arr::get($defaults, 'permission_ids', []),
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'file' => $errors,
            ]);
        }

        return array_values($normalized);
    }

    private function readRows(UploadedFile $file): array
    {
        $reader = match (Str::lower($file->getClientOriginalExtension())) {
            'csv', 'txt' => new CsvReader(),
            'ods' => new OdsReader(),
            default => new XlsxReader(),
        };

        $reader->open($file->getRealPath());

        $header = null;
        $rows = [];

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $values = array_map(
                    fn ($value) => is_string($value) ? trim($value) : $value,
                    $row->toArray(),
                );

                if ($header === null) {
                    $header = array_map(
                        fn ($value) => Str::of((string) $value)->trim()->lower()->replace(' ', '_')->toString(),
                        $values,
                    );

                    continue;
                }

                $rows[] = array_combine($header, array_pad($values, count($header), null));
            }

            break;
        }

        $reader->close();

        return $rows;
    }

    private function resolveNames(string $raw, array $map): array
    {
        $items = collect(explode(',', $raw))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->values();

        $ids = [];
        $missing = [];

        foreach ($items as $item) {
            $id = $map[Str::lower($item)] ?? null;

            if ($id) {
                $ids[] = $id;
            } else {
                $missing[] = $item;
            }
        }

        return [array_values(array_unique($ids)), $missing];
    }

    private function resolveBoolean(mixed $value, bool $default): bool
    {
        if ($value === null || $value === '') {
            return $default;
        }

        return in_array(Str::lower((string) $value), ['1', 'true', 'yes', 'y'], true);
    }
}
