<?php

namespace App\Services\Performance;

use App\Models\EmployeeFieldSetting;
use App\Support\Performance\EmployeeFieldRegistry;
use Illuminate\Support\Collection;

class EmployeeFieldConfigService
{
    public function ensureDefaults(): void
    {
        $definitions = EmployeeFieldRegistry::definitions();

        foreach (EmployeeFieldRegistry::screens() as $screenKey => $label) {
            $defaults = EmployeeFieldRegistry::defaults()[$screenKey] ?? [];
            $allowedFields = collect($definitions)
                ->filter(fn (array $definition) => in_array($screenKey, $definition['allowed_screens'], true))
                ->keys()
                ->values();

            foreach ($allowedFields as $index => $fieldKey) {
                $default = $defaults[$fieldKey] ?? ['enabled' => false, 'required' => false];

                EmployeeFieldSetting::query()->firstOrCreate(
                    ['screen_key' => $screenKey, 'field_key' => $fieldKey],
                    [
                        'is_enabled' => (bool) $default['enabled'],
                        'is_required' => (bool) $default['required'],
                        'display_order' => $index + 1,
                    ],
                );
            }
        }
    }

    public function forScreen(string $screenKey): Collection
    {
        $this->ensureDefaults();

        $definitions = collect(EmployeeFieldRegistry::definitions());
        $settings = EmployeeFieldSetting::query()
            ->where('screen_key', $screenKey)
            ->orderBy('display_order')
            ->get()
            ->keyBy('field_key');

        return $definitions
            ->filter(fn (array $definition) => in_array($screenKey, $definition['allowed_screens'], true))
            ->map(function (array $definition, string $fieldKey) use ($settings) {
                $setting = $settings->get($fieldKey);

                return [
                    'field_key' => $fieldKey,
                    'label' => $definition['label'],
                    'section' => $definition['section'],
                    'input_type' => $definition['input_type'],
                    'attribute' => $definition['attribute'],
                    'options_key' => $definition['options_key'] ?? null,
                    'configurable' => $definition['configurable'] ?? true,
                    'enabled' => $setting?->is_enabled ?? false,
                    'required' => $setting?->is_required ?? false,
                    'display_order' => $setting?->display_order ?? 9999,
                ];
            })
            ->sortBy('display_order')
            ->values();
    }

    public function groupedForScreen(string $screenKey): array
    {
        return $this->forScreen($screenKey)
            ->groupBy('section')
            ->map(fn (Collection $fields, string $section) => [
                'section' => $section,
                'fields' => $fields->values()->all(),
            ])
            ->values()
            ->all();
    }

    public function enabledFieldKeys(string $screenKey): array
    {
        return $this->forScreen($screenKey)
            ->filter(fn (array $field) => $field['enabled'])
            ->pluck('field_key')
            ->values()
            ->all();
    }

    public function updateScreen(string $screenKey, array $fields): void
    {
        $this->ensureDefaults();
        $knownFields = $this->forScreen($screenKey)->keyBy('field_key');
        $sortedFields = collect($fields)
            ->sortBy(fn (array $field, int $index) => [
                (int) ($field['display_order'] ?? ($index + 1)),
                $index,
            ])
            ->values();

        foreach ($sortedFields as $index => $field) {
            $fieldKey = $field['field_key'] ?? null;
            $definition = $fieldKey ? $knownFields->get($fieldKey) : null;

            if (! $definition) {
                continue;
            }

            $isEnabled = (bool) ($field['enabled'] ?? false);
            $isRequired = $isEnabled && (bool) ($field['required'] ?? false);

            if (($definition['configurable'] ?? true) === false) {
                $isEnabled = true;
                $isRequired = false;
            }

            EmployeeFieldSetting::query()
                ->where('screen_key', $screenKey)
                ->where('field_key', $fieldKey)
                ->update([
                    'is_enabled' => $isEnabled,
                    'is_required' => $isRequired,
                    'display_order' => $index + 1,
                ]);
        }
    }

    public function screensWithFields(): array
    {
        $this->ensureDefaults();

        return collect(EmployeeFieldRegistry::screens())
            ->map(fn (string $label, string $key) => [
                'key' => $key,
                'label' => $label,
                'fields' => $this->forScreen($key)->all(),
            ])
            ->values()
            ->all();
    }
}
