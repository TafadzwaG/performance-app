<?php

namespace Database\Seeders;

use App\Services\Performance\EmployeeFieldConfigService;
use Illuminate\Database\Seeder;

class EmployeeFieldSettingsSeeder extends Seeder
{
    public function run(): void
    {
        app(EmployeeFieldConfigService::class)->ensureDefaults();
    }
}
