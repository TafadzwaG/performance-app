<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\JobTitle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds the hotel-specific organisational structure:
 *   - 14 hotel departments
 *   - 57 hotel positions, each tagged with its parent department in the
 *     description field (no FK exists between job_titles and departments
 *     in the current schema).
 *
 * Source: "Hotel Information.xlsx" (sheets: Departments, Positions).
 * Re-runnable — uses updateOrCreate keyed on `code`.
 */
class HotelOrgStructureSeeder extends Seeder
{
    public function run(): void
    {
        // -------------------------------------------------------------- DEPARTMENTS
        $departments = [
            ['name' => 'Front Office',       'code' => 'front-office'],
            ['name' => 'Housekeeping',       'code' => 'housekeeping'],
            ['name' => 'Facilities',         'code' => 'facilities'],
            ['name' => 'Accounts',           'code' => 'accounts'],
            ['name' => 'Kitchen',            'code' => 'kitchen'],
            ['name' => 'Banqueting',         'code' => 'banqueting'],
            ['name' => 'Food and Beverage',  'code' => 'food-and-beverage'],
            ['name' => 'Outside Catering',   'code' => 'outcat'],
            ['name' => 'Guest Relations',    'code' => 'guest-relations'],
            ['name' => 'Sales',              'code' => 'sales'],
            ['name' => 'Loss Control',       'code' => 'loss-control'],
            ['name' => 'Human Resources',    'code' => 'human-resources'],
            ['name' => 'Admin and General',  'code' => 'admin-and-general'],
            ['name' => 'ICT',                'code' => 'ict'],
        ];

        foreach ($departments as $dept) {
            Department::query()->updateOrCreate(
                ['code' => $dept['code']],
                [
                    'name' => $dept['name'],
                    'description' => "Hotel department: {$dept['name']}.",
                    'is_active' => true,
                ],
            );
        }

        // -------------------------------------------------------------- POSITIONS
        // Grouped by their natural hotel department. Names are normalised to
        // Title Case; typos in the source file have been corrected
        // (BOOKEEPER -> Bookkeeper, FACILTIES -> Facilities).
        $positionsByDepartment = [
            'Food and Beverage' => [
                'Assistant F&B Manager',
                'F&B Controller',
                'F&B Control Clerk',
                'F&B Supervisor',
                'F&B Cashier',
                'Waiter',
                'Barman',
            ],
            'Banqueting' => [
                'Banqueting Manager',
                'Banqueting Co-ordinator',
                'Banqueting Supervisor',
            ],
            'Outside Catering' => [
                'Outside Catering Co-ordinator',
            ],
            'Kitchen' => [
                'Executive Chef',
                'Sous Chef',
                'Chef de Partie',
                'Class 1 Chef',
                'Senior Sec Cook',
                'Junior Sec Cook',
                'Canteen Chef',
                'Kitchen Porter',
            ],
            'Front Office' => [
                'Front Office Manager',
                'Assistant Front Office Manager',
                'Night Auditor',
                'Reservation Manager',
                'Reservationist',
                'Front Office Supervisor',
                'Front Office Cashier',
                'Switchboard Operator',
            ],
            'Housekeeping' => [
                'Housekeeper',
                'Floor Supervisor',
                'Linen Controller',
                'Laundry Machinist',
                'Bedroom Hand',
            ],
            'Facilities' => [
                'Facilities Manager',
                'Refrigeration Mechanic',
                'Facilities Supervisor',
                'Handyman',
                'Gardener',
            ],
            'Guest Relations' => [
                'Guest Relations Manager',
                'Guest Relations Officer',
            ],
            'Accounts' => [
                'Hotel Financial Controller',
                'Assistant Accountant',
                'Debtors Controller',
                'Stocks Controller',
                'Revenue Controller',
                'Bookkeeper',
                'Storeman',
                'Creditors Clerk',
                'Receiving Clerk',
            ],
            'Admin and General' => [
                'General Manager',
                'Deputy General Manager',
                'GM Secretary',
            ],
            'Human Resources' => [
                'HR Manager',
                'HR Officer',
            ],
            'ICT' => [
                'Systems Administrator',
                'Assistant Systems Administrator',
            ],
            'Loss Control' => [
                'Risk, Health and Safety Manager',
                'Loss Control Supervisor',
            ],
        ];

        foreach ($positionsByDepartment as $departmentName => $positions) {
            foreach ($positions as $position) {
                $code = Str::slug($position);

                JobTitle::query()->updateOrCreate(
                    ['code' => $code],
                    [
                        'name' => $position,
                        'description' => "{$departmentName} — {$position}.",
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
