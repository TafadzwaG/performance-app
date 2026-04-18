<?php

namespace App\Http\Requests\Performance;

use App\Services\Performance\EmployeeFieldConfigService;
use App\Support\Performance\EmployeeFieldRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UpdateEmployeeFieldSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('performance.employees.configure_fields');
    }

    public function rules(): array
    {
        return [
            'screens' => ['required', 'array'],
            'screens.*.key' => ['required', Rule::in(array_keys(EmployeeFieldRegistry::screens()))],
            'screens.*.fields' => ['required', 'array'],
            'screens.*.fields.*.field_key' => ['required', 'string'],
            'screens.*.fields.*.enabled' => ['required', 'boolean'],
            'screens.*.fields.*.required' => ['required', 'boolean'],
        ];
    }

    protected function passedValidation(): void
    {
        $configService = app(EmployeeFieldConfigService::class);

        foreach ($this->validated('screens', []) as $screen) {
            $knownFields = collect($configService->forScreen($screen['key']))->keyBy('field_key');

            foreach ($screen['fields'] as $field) {
                $definition = $knownFields->get($field['field_key']);

                if (! $definition) {
                    throw ValidationException::withMessages(['screens' => 'Unknown employee field configuration entry detected.']);
                }

                if (! $field['enabled'] && $field['required']) {
                    throw ValidationException::withMessages(['screens' => "{$definition['label']} cannot be required while disabled."]);
                }
            }

            if ($screen['key'] === EmployeeFieldRegistry::SCREEN_COMPLETE_PROFILE) {
                $hasIdentityField = collect($screen['fields'])
                    ->filter(fn (array $field) => ($knownFields[$field['field_key']]['section'] ?? null) === 'identity' && $field['enabled'])
                    ->isNotEmpty();

                if (! $hasIdentityField) {
                    throw ValidationException::withMessages(['screens' => 'Complete Profile must keep at least one identity field enabled.']);
                }
            }
        }
    }
}
