<?php

namespace App\Services\Performance;

use App\Enums\EmploymentStatus;
use App\Models\Department;
use App\Models\EmployeeProfile;
use App\Models\JobTitle;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\ODS\Reader as OdsReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

class EmployeeImportService
{
    public const SESSION_KEY = 'employee_import_upload';

    public function __construct(
        private readonly EmployeeIdentityService $employeeIdentity,
    ) {}

    /**
     * @return array{
     *     row_count: int,
     *     departments: array<int, array{source: string, row_count: int, matched_id: int|null, matched_label: string|null}>,
     *     job_titles: array<int, array{source: string, row_count: int, matched_id: int|null, matched_label: string|null}>,
     *     row_errors: array<int, string>,
     *     sample_rows: array<int, array{line: int, user_email: string, employee_number: string, department_name: string, job_title_name: string}>
     * }
     */
    public function preview(UploadedFile $file): array
    {
        $rows = $this->readRows($file);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => ['The upload file does not contain any employee rows.'],
            ]);
        }

        $departmentMap = $this->nameMap(Department::query()->get(['id', 'name', 'code']));
        $jobTitleMap = $this->nameMap(JobTitle::query()->get(['id', 'name', 'code']));
        $departmentLabels = $this->labelMap(Department::query()->get(['id', 'name', 'code']));
        $jobTitleLabels = $this->labelMap(JobTitle::query()->get(['id', 'name', 'code']));

        $departmentCounts = [];
        $jobTitleCounts = [];
        $rowErrors = [];
        $sampleRows = [];
        $rowCount = 0;

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $employeeNumber = $this->employeeIdentity->normalizeEmployeeNumber((string) ($row['employee_number'] ?? ''));

            if ($employeeNumber === '') {
                continue;
            }

            $rowCount++;

            if (count($sampleRows) < 8) {
                $sampleRows[] = [
                    'line' => $line,
                    'user_email' => (string) ($row['user_email'] ?? ''),
                    'employee_number' => $employeeNumber,
                    'department_name' => trim((string) ($row['department_name'] ?? '')),
                    'job_title_name' => trim((string) ($row['job_title_name'] ?? '')),
                ];
            }

            $departmentName = trim((string) ($row['department_name'] ?? ''));
            if ($departmentName !== '') {
                $departmentCounts[$departmentName] = ($departmentCounts[$departmentName] ?? 0) + 1;
            } else {
                $rowErrors[] = "Row {$line} is missing department_name.";
            }

            $jobTitleName = trim((string) ($row['job_title_name'] ?? ''));
            if ($jobTitleName !== '') {
                $jobTitleCounts[$jobTitleName] = ($jobTitleCounts[$jobTitleName] ?? 0) + 1;
            } else {
                $rowErrors[] = "Row {$line} is missing job_title_name.";
            }
        }

        if ($rowCount === 0) {
            throw ValidationException::withMessages([
                'file' => ['The upload file does not contain any valid employee rows.'],
            ]);
        }

        return [
            'row_count' => $rowCount,
            'departments' => $this->buildMappingPreview($departmentCounts, $departmentMap, $departmentLabels),
            'job_titles' => $this->buildMappingPreview($jobTitleCounts, $jobTitleMap, $jobTitleLabels),
            'row_errors' => $rowErrors,
            'sample_rows' => $sampleRows,
        ];
    }

    /**
     * @param  array<string, string>  $departmentMappings
     * @param  array<string, string>  $jobTitleMappings
     * @return array<int, array<string, mixed>>
     */
    public function parse(UploadedFile $file, array $departmentMappings = [], array $jobTitleMappings = []): array
    {
        $rows = $this->readRows($file);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => ['The upload file does not contain any employee rows.'],
            ]);
        }

        $departmentMap = $this->nameMap(Department::query()->get(['id', 'name', 'code']));
        $jobTitleMap = $this->nameMap(JobTitle::query()->get(['id', 'name', 'code']));
        $normalizedDepartmentMappings = $this->normalizeMappings($departmentMappings);
        $normalizedJobTitleMappings = $this->normalizeMappings($jobTitleMappings);
        $userEmailMap = User::query()->pluck('id', 'email')
            ->mapWithKeys(fn ($id, $email) => [Str::lower((string) $email) => $id])
            ->all();
        $employeeNumberUserMap = $this->employeeIdentity->userIdsByEmployeeNumber();
        $usersWithProfiles = EmployeeProfile::query()->pluck('user_id')->all();
        $seenEmployeeNumbers = [];
        $roleMap = Role::query()->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [Str::lower((string) $name) => $id])
            ->all();

        $normalized = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $employeeNumber = $this->employeeIdentity->normalizeEmployeeNumber((string) ($row['employee_number'] ?? ''));

            if ($employeeNumber === '') {
                continue;
            }

            if (isset($seenEmployeeNumbers[$employeeNumber])) {
                $errors[] = "Row {$line} duplicates employee_number: {$employeeNumber}.";

                continue;
            }

            if ($this->employeeIdentity->employeeNumberExists($employeeNumber)) {
                $errors[] = "Row {$line} employee_number already exists: {$employeeNumber}.";

                continue;
            }

            $userEmail = Str::lower(trim((string) ($row['user_email'] ?? '')));

            if ($userEmail === '') {
                $errors[] = "Row {$line} is missing user_email.";

                continue;
            }

            $userId = $userEmailMap[$userEmail] ?? null;
            if (! $userId) {
                $errors[] = "Row {$line} has unknown user_email: {$userEmail}.";

                continue;
            }

            if (in_array($userId, $usersWithProfiles, true)) {
                $errors[] = "Row {$line} is already linked to an employee profile.";

                continue;
            }

            [$departmentId, $departmentError] = $this->resolveReference(
                $row['department_name'] ?? '',
                $departmentMap,
                $normalizedDepartmentMappings,
                'department_name',
            );
            if ($departmentError) {
                $errors[] = "Row {$line} {$departmentError}";

                continue;
            }

            [$jobTitleId, $jobTitleError] = $this->resolveReference(
                $row['job_title_name'] ?? '',
                $jobTitleMap,
                $normalizedJobTitleMappings,
                'job_title_name',
            );
            if ($jobTitleError) {
                $errors[] = "Row {$line} {$jobTitleError}";

                continue;
            }

            $lineManagerId = $this->resolveManagerUserId(
                $row,
                'line_manager_employee_number',
                'line_manager_email',
                $employeeNumberUserMap,
                $userEmailMap,
                $line,
                $errors,
            );
            $approvingManagerId = $this->resolveManagerUserId(
                $row,
                'approving_manager_employee_number',
                'approving_manager_email',
                $employeeNumberUserMap,
                $userEmailMap,
                $line,
                $errors,
            );

            if ($lineManagerId === false || $approvingManagerId === false) {
                continue;
            }

            [$roleIds, $missingRoles] = $this->resolveNames($row['role_names'] ?? '', $roleMap);
            if ($missingRoles !== []) {
                $errors[] = 'Row '.$line.' has unknown roles: '.implode(', ', $missingRoles).'.';

                continue;
            }

            $employmentStatus = Str::lower(trim((string) ($row['employment_status'] ?? 'active')));
            if ($employmentStatus !== '' && ! in_array($employmentStatus, array_map(fn (EmploymentStatus $status) => $status->value, EmploymentStatus::cases()), true)) {
                $errors[] = "Row {$line} has invalid employment_status: {$employmentStatus}.";

                continue;
            }

            $normalized[] = [
                'user_id' => $userId,
                'employee_number' => $employeeNumber,
                'department_id' => $departmentId,
                'job_title_id' => $jobTitleId,
                'line_manager_user_id' => $lineManagerId,
                'approving_manager_user_id' => $approvingManagerId,
                'national_id' => $this->nullableString($row['national_id'] ?? null),
                'date_of_birth' => $this->nullableString($row['date_of_birth'] ?? null),
                'gender' => $this->nullableString($row['gender'] ?? null),
                'marital_status' => $this->nullableString($row['marital_status'] ?? null),
                'personal_phone' => $this->nullableString($row['personal_phone'] ?? null),
                'employment_status' => $employmentStatus !== '' ? $employmentStatus : EmploymentStatus::Active->value,
                'employment_type' => $this->nullableString($row['employment_type'] ?? null),
                'work_location' => $this->nullableString($row['work_location'] ?? null),
                'hire_date' => $this->nullableString($row['hire_date'] ?? null),
                'is_active' => $this->resolveBoolean($row['is_active'] ?? null, true),
                'is_review_eligible' => $this->resolveBoolean($row['is_review_eligible'] ?? null, true),
                'role_ids' => $roleIds,
            ];

            $usersWithProfiles[] = $userId;
            $seenEmployeeNumbers[$employeeNumber] = true;
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'file' => $errors,
            ]);
        }

        if ($normalized === []) {
            throw ValidationException::withMessages([
                'file' => ['The upload file does not contain any valid employee rows.'],
            ]);
        }

        return $normalized;
    }

    public function import(array $rows): int
    {
        return DB::transaction(function () use ($rows) {
            $created = 0;

            foreach ($rows as $row) {
                $roleIds = $row['role_ids'] ?? [];
                $attributes = Arr::except($row, ['role_ids']);

                $profile = EmployeeProfile::create($attributes);

                if ($roleIds !== [] && $profile->user) {
                    $roles = Role::query()->whereIn('id', $roleIds)->get();
                    $profile->user->syncRoles($roles);
                }

                $created++;
            }

            return $created;
        });
    }

    public function storeUploadForSession(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension() ?: 'csv';
        $path = 'imports/employees/'.Str::uuid().'.'.$extension;

        Storage::disk('local')->put($path, file_get_contents($file->getRealPath()));

        return $path;
    }

    public function uploadedFileFromSession(array $session): UploadedFile
    {
        $path = $session['path'] ?? '';

        if ($path === '' || ! Storage::disk('local')->exists($path)) {
            throw ValidationException::withMessages([
                'file' => ['Upload session expired. Please upload your file again.'],
            ]);
        }

        $absolutePath = Storage::disk('local')->path($path);

        return new UploadedFile(
            $absolutePath,
            $session['original_name'] ?? basename($absolutePath),
            null,
            null,
            true,
        );
    }

    public function clearSessionUpload(array $session): void
    {
        if (isset($session['path'])) {
            Storage::disk('local')->delete($session['path']);
        }
    }

    /**
     * @param  array<string, int>  $counts
     * @param  array<string, int>  $map
     * @param  array<int, string>  $labels
     * @return array<int, array{source: string, row_count: int, matched_id: int|null, matched_label: string|null}>
     */
    private function buildMappingPreview(array $counts, array $map, array $labels): array
    {
        return collect($counts)
            ->map(function (int $rowCount, string $source) use ($map, $labels) {
                $matchedId = $map[Str::lower($source)] ?? null;

                return [
                    'source' => $source,
                    'row_count' => $rowCount,
                    'matched_id' => $matchedId,
                    'matched_label' => $matchedId ? ($labels[$matchedId] ?? null) : null,
                ];
            })
            ->sortBy('source')
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readRows(UploadedFile $file): array
    {
        $reader = match (Str::lower($file->getClientOriginalExtension())) {
            'csv', 'txt' => new CsvReader,
            'ods' => new OdsReader,
            default => new XlsxReader,
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

    /**
     * @param  iterable<int, Department|JobTitle>  $records
     * @return array<string, int>
     */
    private function nameMap(iterable $records): array
    {
        $map = [];

        foreach ($records as $record) {
            $map[Str::lower((string) $record->name)] = $record->id;

            if (filled($record->code ?? null)) {
                $map[Str::lower((string) $record->code)] = $record->id;
            }
        }

        return $map;
    }

    /**
     * @param  iterable<int, Department|JobTitle>  $records
     * @return array<int, string>
     */
    private function labelMap(iterable $records): array
    {
        $labels = [];

        foreach ($records as $record) {
            $labels[$record->id] = filled($record->code ?? null)
                ? "{$record->name} ({$record->code})"
                : (string) $record->name;
        }

        return $labels;
    }

    /**
     * @param  array<string, string>  $userMappings
     * @return array<string, int>
     */
    private function normalizeMappings(array $userMappings): array
    {
        $normalized = [];

        foreach ($userMappings as $source => $id) {
            if ($source === '' || $id === '' || $id === null) {
                continue;
            }

            $normalized[Str::lower(trim((string) $source))] = (int) $id;
        }

        return $normalized;
    }

    /**
     * @param  array<string, int>  $map
     * @param  array<string, int>  $userMappings
     * @return array{0: ?int, 1: ?string}
     */
    private function resolveReference(string $raw, array $map, array $userMappings, string $label): array
    {
        $value = trim($raw);

        if ($value === '') {
            return [null, "is missing {$label}."];
        }

        $key = Str::lower($value);

        if (isset($userMappings[$key])) {
            return [$userMappings[$key], null];
        }

        $id = $map[$key] ?? null;

        if (! $id) {
            return [null, "has unknown {$label}: {$value}. Map it on the preview step before importing."];
        }

        return [$id, null];
    }

    /**
     * @param  array<string, int>  $employeeNumberUserMap
     * @param  array<string, int>  $userEmailMap
     */
    private function resolveManagerUserId(
        array $row,
        string $employeeNumberColumn,
        string $emailColumn,
        array $employeeNumberUserMap,
        array $userEmailMap,
        int $line,
        array &$errors,
    ): int|null|false {
        $employeeNumber = $this->employeeIdentity->normalizeEmployeeNumber((string) ($row[$employeeNumberColumn] ?? ''));

        if ($employeeNumber !== '') {
            return $this->employeeIdentity->resolveUserIdByEmployeeNumber(
                $employeeNumber,
                $employeeNumberUserMap,
                $line,
                $employeeNumberColumn,
                $errors,
            );
        }

        $email = Str::lower(trim((string) ($row[$emailColumn] ?? '')));

        if ($email === '') {
            return null;
        }

        $userId = $userEmailMap[$email] ?? null;

        if (! $userId) {
            $errors[] = "Row {$line} has unknown {$emailColumn}: {$email}.";

            return false;
        }

        return $userId;
    }

    /**
     * @param  array<string, int>  $map
     * @return array{0: array<int, int>, 1: array<int, string>}
     */
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

    private function nullableString(mixed $value): ?string
    {
        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }
}
