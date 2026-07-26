<?php

namespace App\Services\Performance;

use App\Models\Department;
use App\Models\GoalLibraryItem;
use App\Models\JobTitle;
use App\Models\Perspective;
use App\Models\User;
use App\Support\Tenancy\TenantStoragePath;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\ODS\Reader as OdsReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

class GoalLibraryImportService
{
    public const SESSION_KEY = 'goal_library_import_upload';

    public function preview(UploadedFile $file): array
    {
        $rows = $this->readGoalRows($file);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => ['The upload file does not contain any goal rows.'],
            ]);
        }

        $perspectiveMap = $this->nameMap(Perspective::query()->get(['id', 'name', 'code']));
        $departmentMap = $this->nameMap(Department::query()->get(['id', 'name', 'code']));
        $jobTitleMap = $this->nameMap(JobTitle::query()->get(['id', 'name', 'code']));
        $perspectiveLabels = $this->labelMap(Perspective::query()->get(['id', 'name', 'code']));
        $departmentLabels = $this->labelMap(Department::query()->get(['id', 'name', 'code']));
        $jobTitleLabels = $this->labelMap(JobTitle::query()->get(['id', 'name', 'code']));

        $perspectiveCounts = [];
        $departmentCounts = [];
        $jobTitleCounts = [];
        $rowErrors = [];
        $sampleRows = [];
        $rowCount = 0;

        foreach ($rows as $row) {
            $line = (int) ($row['_line'] ?? 0);
            $objective = trim((string) ($row['objective'] ?? ''));
            $perspective = trim((string) ($row['perspective'] ?? ''));

            if ($objective === '' && $perspective === '') {
                continue;
            }

            $hasError = false;

            if ($perspective === '') {
                $rowErrors[] = "Row {$line} is missing perspective.";
                $hasError = true;
            }

            if ($objective === '') {
                $rowErrors[] = "Row {$line} is missing objective.";
                $hasError = true;
            }

            if ($hasError) {
                continue;
            }

            $rowCount++;
            $perspectiveCounts[$perspective] = ($perspectiveCounts[$perspective] ?? 0) + 1;

            $department = trim((string) ($row['department_name'] ?? ''));
            if ($department !== '') {
                $departmentCounts[$department] = ($departmentCounts[$department] ?? 0) + 1;
            }

            $jobTitle = trim((string) ($row['job_title_name'] ?? ''));
            if ($jobTitle !== '') {
                $jobTitleCounts[$jobTitle] = ($jobTitleCounts[$jobTitle] ?? 0) + 1;
            }

            if (count($sampleRows) < 8) {
                $sampleRows[] = [
                    'line' => $line,
                    'perspective' => $perspective,
                    'objective' => $objective,
                    'kpi_measure' => trim((string) ($row['kpi_measure'] ?? '')),
                    'target_definition' => trim((string) ($row['target_definition'] ?? '')),
                    'weight' => trim((string) ($row['weight'] ?? '')),
                    'evidence_source' => trim((string) ($row['evidence_source'] ?? '')),
                    'department_name' => $department,
                    'job_title_name' => $jobTitle,
                ];
            }
        }

        return [
            'row_count' => $rowCount,
            'perspectives' => $this->buildMappingPreview($perspectiveCounts, $perspectiveMap, $perspectiveLabels),
            'departments' => $this->buildMappingPreview($departmentCounts, $departmentMap, $departmentLabels),
            'job_titles' => $this->buildMappingPreview($jobTitleCounts, $jobTitleMap, $jobTitleLabels),
            'row_errors' => $rowErrors,
            'sample_rows' => $sampleRows,
        ];
    }

    public function parse(UploadedFile $file, array $perspectiveMappings = [], array $departmentMappings = [], array $jobTitleMappings = [], ?User $user = null): array
    {
        $rows = $this->readGoalRows($file);

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => ['The upload file does not contain any goal rows.'],
            ]);
        }

        $scopeService = app(GoalLibraryScopeService::class);
        $scopedWriteAttributes = ($user !== null && $scopeService->appliesTo($user))
            ? $scopeService->enforcedWriteAttributes($user)
            : null;

        $perspectiveMap = $this->nameMap(Perspective::query()->get(['id', 'name', 'code']));
        $departmentMap = $this->nameMap(Department::query()->get(['id', 'name', 'code']));
        $jobTitleMap = $this->nameMap(JobTitle::query()->get(['id', 'name', 'code']));
        $normalizedPerspectiveMappings = $this->normalizeMappings($perspectiveMappings);
        $normalizedDepartmentMappings = $this->normalizeMappings($departmentMappings);
        $normalizedJobTitleMappings = $this->normalizeMappings($jobTitleMappings);

        $normalized = [];
        $errors = [];

        foreach ($rows as $row) {
            $line = (int) ($row['_line'] ?? 0);
            $objective = trim((string) ($row['objective'] ?? ''));
            $perspective = trim((string) ($row['perspective'] ?? ''));

            if ($objective === '' && $perspective === '') {
                continue;
            }

            if ($objective === '') {
                $errors[] = "Row {$line} is missing objective.";

                continue;
            }

            [$perspectiveId, $perspectiveError] = $this->resolveRequiredReference($perspective, $perspectiveMap, $normalizedPerspectiveMappings, 'perspective');
            if ($perspectiveError) {
                $errors[] = "Row {$line} {$perspectiveError}";

                continue;
            }

            if ($scopedWriteAttributes !== null) {
                $departmentId = $scopedWriteAttributes['department_id'];
                $jobTitleId = $scopedWriteAttributes['job_title_id'];
            } else {
                [$departmentId, $departmentError] = $this->resolveOptionalReference($row['department_name'] ?? '', $departmentMap, $normalizedDepartmentMappings, 'department_name');
                if ($departmentError) {
                    $errors[] = "Row {$line} {$departmentError}";

                    continue;
                }

                [$jobTitleId, $jobTitleError] = $this->resolveOptionalReference($row['job_title_name'] ?? '', $jobTitleMap, $normalizedJobTitleMappings, 'job_title_name');
                if ($jobTitleError) {
                    $errors[] = "Row {$line} {$jobTitleError}";

                    continue;
                }
            }

            $normalized[] = [
                'department_id' => $departmentId,
                'job_title_id' => $jobTitleId,
                'perspective_id' => $perspectiveId,
                'title' => $objective,
                'description' => null,
                'kpi_measure' => $this->nullableString($row['kpi_measure'] ?? null),
                'target_definition' => $this->nullableString($row['target_definition'] ?? null),
                'default_weight' => $this->nullableDecimal($row['weight'] ?? null),
                'evidence_source' => $this->nullableString($row['evidence_source'] ?? null),
                'is_active' => $this->resolveBoolean($row['is_active'] ?? null, true),
            ];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'file' => $errors,
            ]);
        }

        if ($normalized === []) {
            throw ValidationException::withMessages([
                'file' => ['The upload file does not contain any valid goal rows.'],
            ]);
        }

        return $normalized;
    }

    public function import(array $rows): int
    {
        return DB::transaction(function () use ($rows) {
            $created = 0;

            foreach ($rows as $row) {
                GoalLibraryItem::create($row);
                $created++;
            }

            return $created;
        });
    }

    public function storeUploadForSession(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension() ?: 'csv';
        $path = TenantStoragePath::privateImport('goal-library', Str::uuid().'.'.$extension);

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

    private function readGoalRows(UploadedFile $file): array
    {
        $rawRows = $this->readRawRows($file);

        if ($rawRows === []) {
            return [];
        }

        $firstHeader = $this->normalizeHeaderRow($rawRows[0]);

        if (in_array('objective', $firstHeader, true) || in_array('title', $firstHeader, true)) {
            return $this->rowsFromHeader($rawRows, 0, []);
        }

        $metadata = $this->extractFormMetadata($rawRows);

        foreach ($rawRows as $index => $row) {
            $header = $this->normalizeHeaderRow($row);

            if (in_array('perspective', $header, true) && in_array('objective', $header, true)) {
                return $this->rowsFromHeader($rawRows, $index, $metadata);
            }
        }

        return [];
    }

    private function rowsFromHeader(array $rawRows, int $headerIndex, array $defaults): array
    {
        $header = $this->normalizeHeaderRow($rawRows[$headerIndex]);
        $rows = [];

        foreach (array_slice($rawRows, $headerIndex + 1, null, true) as $index => $values) {
            $row = array_combine($header, array_pad($values, count($header), null));

            if (! is_array($row)) {
                continue;
            }

            $rows[] = [
                '_line' => $index + 1,
                'perspective' => $row['perspective'] ?? '',
                'objective' => $row['objective'] ?? $row['title'] ?? '',
                'kpi_measure' => $row['kpi_measure'] ?? '',
                'target_definition' => $row['target_definition'] ?? $row['target'] ?? '',
                'weight' => $row['weight'] ?? $row['default_weight'] ?? '',
                'evidence_source' => $row['evidence_source'] ?? '',
                'department_name' => $row['department_name'] ?? $defaults['department_name'] ?? '',
                'job_title_name' => $row['job_title_name'] ?? $defaults['job_title_name'] ?? '',
                'is_active' => $row['is_active'] ?? '',
            ];
        }

        return $rows;
    }

    private function readRawRows(UploadedFile $file): array
    {
        $reader = match (Str::lower($file->getClientOriginalExtension())) {
            'csv', 'txt' => new CsvReader,
            'ods' => new OdsReader,
            default => new XlsxReader,
        };

        $reader->open($file->getRealPath());

        $rows = [];

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = array_map(
                    fn ($value) => is_string($value) ? trim($value) : $value,
                    $row->toArray(),
                );
            }

            break;
        }

        $reader->close();

        return $rows;
    }

    private function normalizeHeaderRow(array $values): array
    {
        return array_map(fn ($value) => $this->normalizeHeader((string) $value), $values);
    }

    private function normalizeHeader(string $value): string
    {
        $normalized = Str::of($value)
            ->lower()
            ->replaceMatches('/\([^)]*\)/', '')
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();

        return match ($normalized) {
            'objective', 'goal', 'the_goal', 'objective_the_goal' => 'objective',
            'kpi', 'kpi_performance_measure', 'performance_measure', 'measure', 'how_measured' => 'kpi_measure',
            'target', 'success_definition', 'target_success_definition' => 'target_definition',
            'evidence', 'source' => 'evidence_source',
            'department' => 'department_name',
            'job_title', 'role' => 'job_title_name',
            default => $normalized,
        };
    }

    private function extractFormMetadata(array $rawRows): array
    {
        $metadata = [];

        foreach ($rawRows as $row) {
            $normalized = array_map(fn ($value) => Str::lower(trim((string) $value)), $row);

            foreach ($normalized as $index => $value) {
                $next = trim((string) ($row[$index + 1] ?? ''));

                if ($value === 'department' && $next !== '') {
                    $metadata['department_name'] = $next;
                }

                if ($value === 'job title' && $next !== '') {
                    $metadata['job_title_name'] = $next;
                }
            }
        }

        return $metadata;
    }

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

    private function resolveRequiredReference(string $raw, array $map, array $userMappings, string $label): array
    {
        $value = trim($raw);

        if ($value === '') {
            return [null, "is missing {$label}."];
        }

        $key = Str::lower($value);
        $id = $userMappings[$key] ?? $map[$key] ?? null;

        if (! $id) {
            return [null, "has unknown {$label}: {$value}. Map it on the preview step before importing."];
        }

        return [$id, null];
    }

    private function resolveOptionalReference(string $raw, array $map, array $userMappings, string $label): array
    {
        $value = trim($raw);

        if ($value === '') {
            return [null, null];
        }

        $key = Str::lower($value);
        $id = $userMappings[$key] ?? $map[$key] ?? null;

        if (! $id) {
            return [null, "has unknown {$label}: {$value}. Map it on the preview step before importing."];
        }

        return [$id, null];
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

    private function nullableDecimal(mixed $value): ?float
    {
        $string = trim((string) $value);

        if ($string === '') {
            return null;
        }

        $number = preg_replace('/[^0-9.\-]/', '', $string);

        return is_numeric($number) ? (float) $number : null;
    }
}
