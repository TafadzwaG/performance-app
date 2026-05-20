<?php

namespace App\Support\Performance;

class EmployeeFieldRegistry
{
    public const SCREEN_COMPLETE_PROFILE = 'complete_profile';

    public const SCREEN_EMPLOYEE_CREATE = 'employee_create';

    public const SCREEN_EMPLOYEE_EDIT = 'employee_edit';

    public const SCREEN_EMPLOYEE_INDEX = 'employee_index';

    public const SCREEN_EMPLOYEE_SHOW = 'employee_show';

    public const SCREEN_EMPLOYEE_SELF_EDIT = 'employee_self_edit';

    public static function screens(): array
    {
        return [
            self::SCREEN_COMPLETE_PROFILE => 'Complete Profile',
            self::SCREEN_EMPLOYEE_CREATE => 'Employee Create',
            self::SCREEN_EMPLOYEE_EDIT => 'Employee Edit',
            self::SCREEN_EMPLOYEE_INDEX => 'Employee Index',
            self::SCREEN_EMPLOYEE_SHOW => 'Employee Show',
            self::SCREEN_EMPLOYEE_SELF_EDIT => 'My Profile Edit',
        ];
    }

    public static function definitions(): array
    {
        return [
            'user_name' => ['label' => 'Employee Name', 'section' => 'identity', 'input_type' => 'display', 'attribute' => 'user.name', 'allowed_screens' => [self::SCREEN_EMPLOYEE_INDEX, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'user_email' => ['label' => 'User Email', 'section' => 'identity', 'input_type' => 'display', 'attribute' => 'user.email', 'allowed_screens' => [self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'user_id' => ['label' => 'Linked User', 'section' => 'identity', 'input_type' => 'select', 'attribute' => 'user_id', 'options_key' => 'userOptions', 'allowed_screens' => [self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT], 'configurable' => false],
            'employee_number' => ['label' => 'Employee Number', 'section' => 'identity', 'input_type' => 'text', 'attribute' => 'employee_number', 'allowed_screens' => array_keys(self::screens()), 'configurable' => true],
            'national_id' => ['label' => 'National ID', 'section' => 'identity', 'input_type' => 'text', 'attribute' => 'national_id', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_INDEX, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'date_of_birth' => ['label' => 'Date of Birth', 'section' => 'identity', 'input_type' => 'date', 'attribute' => 'date_of_birth', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'gender' => ['label' => 'Gender', 'section' => 'identity', 'input_type' => 'select', 'attribute' => 'gender', 'options_key' => 'genderOptions', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'marital_status' => ['label' => 'Marital Status', 'section' => 'identity', 'input_type' => 'select', 'attribute' => 'marital_status', 'options_key' => 'maritalStatusOptions', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'personal_phone' => ['label' => 'Personal Phone', 'section' => 'contact', 'input_type' => 'phone', 'attribute' => 'personal_phone', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'home_address_line_1' => ['label' => 'Address Line 1', 'section' => 'contact', 'input_type' => 'text', 'attribute' => 'home_address_line_1', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'home_address_line_2' => ['label' => 'Address Line 2', 'section' => 'contact', 'input_type' => 'text', 'attribute' => 'home_address_line_2', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'city' => ['label' => 'City', 'section' => 'contact', 'input_type' => 'text', 'attribute' => 'city', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'state_province' => ['label' => 'State / Province', 'section' => 'contact', 'input_type' => 'text', 'attribute' => 'state_province', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'postal_code' => ['label' => 'Postal Code', 'section' => 'contact', 'input_type' => 'text', 'attribute' => 'postal_code', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'country' => ['label' => 'Country', 'section' => 'contact', 'input_type' => 'select', 'attribute' => 'country', 'options_key' => 'countryOptions', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'emergency_contact_name' => ['label' => 'Emergency Contact Name', 'section' => 'contact', 'input_type' => 'text', 'attribute' => 'emergency_contact_name', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'emergency_contact_phone' => ['label' => 'Emergency Contact Phone', 'section' => 'contact', 'input_type' => 'phone', 'attribute' => 'emergency_contact_phone', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'department_id' => ['label' => 'Department', 'section' => 'employment', 'input_type' => 'select', 'attribute' => 'department_id', 'options_key' => 'departmentOptions', 'allowed_screens' => array_keys(self::screens()), 'configurable' => true],
            'job_title_id' => ['label' => 'Job Title', 'section' => 'employment', 'input_type' => 'select', 'attribute' => 'job_title_id', 'options_key' => 'jobTitleOptions', 'allowed_screens' => array_keys(self::screens()), 'configurable' => true],
            'employment_status' => ['label' => 'Employment Status', 'section' => 'employment', 'input_type' => 'select', 'attribute' => 'employment_status', 'options_key' => 'employmentStatusOptions', 'allowed_screens' => array_keys(self::screens()), 'configurable' => true],
            'employment_type' => ['label' => 'Employment Type', 'section' => 'employment', 'input_type' => 'select', 'attribute' => 'employment_type', 'options_key' => 'employmentTypeOptions', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'work_location' => ['label' => 'Work Location', 'section' => 'employment', 'input_type' => 'text', 'attribute' => 'work_location', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'hire_date' => ['label' => 'Hire Date', 'section' => 'employment', 'input_type' => 'date', 'attribute' => 'hire_date', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'probation_end_date' => ['label' => 'Probation End Date', 'section' => 'employment', 'input_type' => 'date', 'attribute' => 'probation_end_date', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'confirmation_date' => ['label' => 'Confirmation Date', 'section' => 'employment', 'input_type' => 'date', 'attribute' => 'confirmation_date', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'line_manager_user_id' => ['label' => 'Line Manager', 'section' => 'performance', 'input_type' => 'select', 'attribute' => 'line_manager_user_id', 'options_key' => 'managerOptions', 'allowed_screens' => array_keys(self::screens()), 'configurable' => true],
            'approving_manager_user_id' => ['label' => 'Approving Manager', 'section' => 'performance', 'input_type' => 'select', 'attribute' => 'approving_manager_user_id', 'options_key' => 'managerOptions', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'is_review_eligible' => ['label' => 'Review Eligible', 'section' => 'performance', 'input_type' => 'checkbox', 'attribute' => 'is_review_eligible', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'review_eligibility_date' => ['label' => 'Review Eligibility Date', 'section' => 'employment', 'input_type' => 'date', 'attribute' => 'review_eligibility_date', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'is_active' => ['label' => 'Active Employee', 'section' => 'performance', 'input_type' => 'checkbox', 'attribute' => 'is_active', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_INDEX, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'notes' => ['label' => 'Notes', 'section' => 'notes', 'input_type' => 'textarea', 'attribute' => 'notes', 'allowed_screens' => [self::SCREEN_COMPLETE_PROFILE, self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT, self::SCREEN_EMPLOYEE_SELF_EDIT, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'role_ids' => ['label' => 'Role Assignment', 'section' => 'performance', 'input_type' => 'roles', 'attribute' => 'role_ids', 'allowed_screens' => [self::SCREEN_EMPLOYEE_CREATE, self::SCREEN_EMPLOYEE_EDIT], 'configurable' => true],
            'latest_overall_score' => ['label' => 'Recent Score', 'section' => 'performance', 'input_type' => 'score', 'attribute' => 'latest_appraisal.overall_score', 'allowed_screens' => [self::SCREEN_EMPLOYEE_INDEX, self::SCREEN_EMPLOYEE_SHOW], 'configurable' => true],
            'appraisal_history' => ['label' => 'Appraisal History', 'section' => 'performance', 'input_type' => 'history', 'attribute' => 'appraisals', 'allowed_screens' => [self::SCREEN_EMPLOYEE_SHOW], 'configurable' => false],
            'linked_account' => ['label' => 'Linked Account', 'section' => 'performance', 'input_type' => 'linked_account', 'attribute' => 'user', 'allowed_screens' => [self::SCREEN_EMPLOYEE_SHOW], 'configurable' => false],
        ];
    }

    public static function defaults(): array
    {
        return [
            self::SCREEN_COMPLETE_PROFILE => [
                'employee_number' => ['enabled' => true, 'required' => true],
                'department_id' => ['enabled' => true, 'required' => true],
                'job_title_id' => ['enabled' => true, 'required' => true],
                'gender' => ['enabled' => true, 'required' => true],
                'employment_status' => ['enabled' => false, 'required' => false],
                'is_review_eligible' => ['enabled' => false, 'required' => false],
                'is_active' => ['enabled' => false, 'required' => false],
            ],
            self::SCREEN_EMPLOYEE_CREATE => [
                'user_id' => ['enabled' => true, 'required' => true],
                'employee_number' => ['enabled' => true, 'required' => true],
                'national_id' => ['enabled' => true, 'required' => false],
                'date_of_birth' => ['enabled' => true, 'required' => false],
                'department_id' => ['enabled' => true, 'required' => true],
                'job_title_id' => ['enabled' => true, 'required' => true],
                'gender' => ['enabled' => true, 'required' => false],
                'marital_status' => ['enabled' => true, 'required' => false],
                'personal_phone' => ['enabled' => true, 'required' => false],
                'home_address_line_1' => ['enabled' => true, 'required' => false],
                'home_address_line_2' => ['enabled' => true, 'required' => false],
                'city' => ['enabled' => true, 'required' => false],
                'state_province' => ['enabled' => true, 'required' => false],
                'postal_code' => ['enabled' => true, 'required' => false],
                'country' => ['enabled' => true, 'required' => false],
                'emergency_contact_name' => ['enabled' => true, 'required' => false],
                'emergency_contact_phone' => ['enabled' => true, 'required' => false],
                'employment_status' => ['enabled' => true, 'required' => true],
                'employment_type' => ['enabled' => true, 'required' => false],
                'work_location' => ['enabled' => true, 'required' => false],
                'hire_date' => ['enabled' => true, 'required' => false],
                'probation_end_date' => ['enabled' => true, 'required' => false],
                'confirmation_date' => ['enabled' => true, 'required' => false],
                'review_eligibility_date' => ['enabled' => true, 'required' => false],
                'line_manager_user_id' => ['enabled' => true, 'required' => false],
                'approving_manager_user_id' => ['enabled' => true, 'required' => false],
                'is_active' => ['enabled' => true, 'required' => false],
                'is_review_eligible' => ['enabled' => true, 'required' => false],
                'notes' => ['enabled' => true, 'required' => false],
                'role_ids' => ['enabled' => true, 'required' => false],
            ],
            self::SCREEN_EMPLOYEE_EDIT => [
                'user_id' => ['enabled' => true, 'required' => true],
                'employee_number' => ['enabled' => true, 'required' => true],
                'national_id' => ['enabled' => true, 'required' => false],
                'date_of_birth' => ['enabled' => true, 'required' => false],
                'department_id' => ['enabled' => true, 'required' => true],
                'job_title_id' => ['enabled' => true, 'required' => true],
                'gender' => ['enabled' => true, 'required' => false],
                'marital_status' => ['enabled' => true, 'required' => false],
                'personal_phone' => ['enabled' => true, 'required' => false],
                'home_address_line_1' => ['enabled' => true, 'required' => false],
                'home_address_line_2' => ['enabled' => true, 'required' => false],
                'city' => ['enabled' => true, 'required' => false],
                'state_province' => ['enabled' => true, 'required' => false],
                'postal_code' => ['enabled' => true, 'required' => false],
                'country' => ['enabled' => true, 'required' => false],
                'emergency_contact_name' => ['enabled' => true, 'required' => false],
                'emergency_contact_phone' => ['enabled' => true, 'required' => false],
                'employment_status' => ['enabled' => true, 'required' => true],
                'employment_type' => ['enabled' => true, 'required' => false],
                'work_location' => ['enabled' => true, 'required' => false],
                'hire_date' => ['enabled' => true, 'required' => false],
                'probation_end_date' => ['enabled' => true, 'required' => false],
                'confirmation_date' => ['enabled' => true, 'required' => false],
                'review_eligibility_date' => ['enabled' => true, 'required' => false],
                'line_manager_user_id' => ['enabled' => true, 'required' => false],
                'approving_manager_user_id' => ['enabled' => true, 'required' => false],
                'is_active' => ['enabled' => true, 'required' => false],
                'is_review_eligible' => ['enabled' => true, 'required' => false],
                'notes' => ['enabled' => true, 'required' => false],
                'role_ids' => ['enabled' => true, 'required' => false],
            ],
            self::SCREEN_EMPLOYEE_INDEX => [
                'user_name' => ['enabled' => true, 'required' => false],
                'employee_number' => ['enabled' => true, 'required' => false],
                'department_id' => ['enabled' => true, 'required' => false],
                'job_title_id' => ['enabled' => true, 'required' => false],
                'line_manager_user_id' => ['enabled' => true, 'required' => false],
                'latest_overall_score' => ['enabled' => true, 'required' => false],
                'employment_status' => ['enabled' => true, 'required' => false],
            ],
            self::SCREEN_EMPLOYEE_SHOW => [
                'user_name' => ['enabled' => true, 'required' => false],
                'user_email' => ['enabled' => true, 'required' => false],
                'employee_number' => ['enabled' => true, 'required' => false],
                'department_id' => ['enabled' => true, 'required' => false],
                'job_title_id' => ['enabled' => true, 'required' => false],
                'gender' => ['enabled' => true, 'required' => false],
                'employment_status' => ['enabled' => true, 'required' => false],
                'line_manager_user_id' => ['enabled' => true, 'required' => false],
                'approving_manager_user_id' => ['enabled' => true, 'required' => false],
                'latest_overall_score' => ['enabled' => true, 'required' => false],
                'appraisal_history' => ['enabled' => true, 'required' => false],
                'linked_account' => ['enabled' => true, 'required' => false],
            ],
            self::SCREEN_EMPLOYEE_SELF_EDIT => [
                'national_id' => ['enabled' => true, 'required' => false],
                'date_of_birth' => ['enabled' => true, 'required' => false],
                'gender' => ['enabled' => true, 'required' => false],
                'marital_status' => ['enabled' => true, 'required' => false],
                'personal_phone' => ['enabled' => true, 'required' => false],
                'home_address_line_1' => ['enabled' => true, 'required' => false],
                'home_address_line_2' => ['enabled' => true, 'required' => false],
                'city' => ['enabled' => true, 'required' => false],
                'state_province' => ['enabled' => true, 'required' => false],
                'postal_code' => ['enabled' => true, 'required' => false],
                'country' => ['enabled' => true, 'required' => false],
                'emergency_contact_name' => ['enabled' => true, 'required' => false],
                'emergency_contact_phone' => ['enabled' => true, 'required' => false],
                'notes' => ['enabled' => true, 'required' => false],
            ],
        ];
    }
}
