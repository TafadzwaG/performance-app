<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employee_profiles', function (Blueprint $table) {
            $table->string('national_id')->nullable()->unique()->after('employee_number');
            $table->date('date_of_birth')->nullable()->after('national_id');
            $table->string('gender')->nullable()->after('date_of_birth');
            $table->string('marital_status')->nullable()->after('gender');
            $table->string('personal_phone')->nullable()->after('marital_status');
            $table->string('home_address_line_1')->nullable()->after('personal_phone');
            $table->string('home_address_line_2')->nullable()->after('home_address_line_1');
            $table->string('city')->nullable()->after('home_address_line_2');
            $table->string('state_province')->nullable()->after('city');
            $table->string('postal_code')->nullable()->after('state_province');
            $table->string('country')->nullable()->after('postal_code');
            $table->string('emergency_contact_name')->nullable()->after('country');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            $table->string('employment_type')->nullable()->after('employment_status');
            $table->string('work_location')->nullable()->after('employment_type');
            $table->date('probation_end_date')->nullable()->after('hire_date');
            $table->date('confirmation_date')->nullable()->after('probation_end_date');
            $table->boolean('is_review_eligible')->default(true)->after('confirmation_date');
            $table->date('review_eligibility_date')->nullable()->after('is_review_eligible');
            $table->text('notes')->nullable()->after('review_eligibility_date');
        });
    }

    public function down(): void
    {
        Schema::table('employee_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'national_id',
                'date_of_birth',
                'gender',
                'marital_status',
                'personal_phone',
                'home_address_line_1',
                'home_address_line_2',
                'city',
                'state_province',
                'postal_code',
                'country',
                'emergency_contact_name',
                'emergency_contact_phone',
                'employment_type',
                'work_location',
                'probation_end_date',
                'confirmation_date',
                'is_review_eligible',
                'review_eligibility_date',
                'notes',
            ]);
        });
    }
};
