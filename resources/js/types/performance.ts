import type { FormDataConvertible } from '@inertiajs/core';

export interface Option {
    value: number | string;
    label: string;
    [key: string]: unknown;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    path: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface RatingScaleLevel {
    id: number;
    label: string;
    short_label?: string | null;
    value: number;
    min_percent?: number | null;
    max_percent?: number | null;
    color?: string | null;
    sort_order: number;
    is_default?: boolean;
}

export interface RatingScale {
    id: number;
    name: string;
    code: string;
    applies_to: string;
    description?: string | null;
    is_active: boolean;
    levels?: RatingScaleLevel[];
}

export interface Department {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    is_active: boolean;
    employee_profiles_count?: number;
    goal_library_items_count?: number;
    appraisal_templates_count?: number;
}

export interface JobTitle {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    is_active: boolean;
    employee_profiles_count?: number;
    goal_library_items_count?: number;
    appraisal_templates_count?: number;
}

export interface Perspective {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    sort_order: number;
    is_active: boolean;
}

export interface Competency {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    category: string;
    department_id?: number | null;
    job_title_id?: number | null;
    is_active: boolean;
    department?: Department | null;
    job_title?: JobTitle | null;
    appraisal_competency_ratings_count?: number;
}

export interface TemplateItem {
    id?: number;
    appraisal_template_id?: number;
    item_type: string;
    perspective_id?: number | null;
    competency_id?: number | null;
    title: string;
    description?: string | null;
    default_weight?: number | null;
    evidence_source_hint?: string | null;
    sort_order: number;
    is_required: boolean;
    perspective?: Perspective | null;
    competency?: Competency | null;
}

export interface Template {
    id: number;
    name: string;
    code: string;
    version: number;
    description?: string | null;
    department_id?: number | null;
    job_title_id?: number | null;
    objective_rating_scale_id: number;
    competency_rating_scale_id: number;
    overall_rating_scale_id: number;
    business_weight_percent: number;
    values_weight_percent: number;
    min_objectives: number;
    max_objectives: number;
    allow_competencies: boolean;
    is_active: boolean;
    department?: Department | null;
    job_title?: JobTitle | null;
    objective_rating_scale?: RatingScale | null;
    competency_rating_scale?: RatingScale | null;
    overall_rating_scale?: RatingScale | null;
    items?: TemplateItem[];
}

export interface GoalLibraryItem {
    id: number;
    department_id?: number | null;
    job_title_id?: number | null;
    perspective_id: number;
    title: string;
    description?: string | null;
    kpi_measure?: string | null;
    target_definition?: string | null;
    default_weight?: number | null;
    evidence_source?: string | null;
    timeline_days?: number | null;
    is_active: boolean;
    department?: Department | null;
    job_title?: JobTitle | null;
    perspective?: Perspective | null;
}

export interface BasicUser {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    force_password_change?: boolean;
    password_changed_at?: string | null;
    welcome_notification_sent_at?: string | null;
    roles?: Array<{ id: number; name: string }>;
    permissions?: Array<{ id: number; name: string }>;
}

export interface AccessUserRecord extends BasicUser {
    employee_profile?: EmployeeProfile | null;
}

export interface AuditTrailRecord {
    id: number;
    user_id?: number | null;
    impersonator_user_id?: number | null;
    action: string;
    method: string;
    route_name?: string | null;
    url: string;
    ip_address?: string | null;
    user_agent?: string | null;
    subject_type?: string | null;
    subject_id?: number | null;
    subject_label?: string | null;
    request_payload?: Record<string, unknown> | null;
    response_status: number;
    occurred_at: string;
    user?: BasicUser | null;
    impersonator?: BasicUser | null;
}

export interface EmployeeProfile {
    id: number;
    user_id: number;
    employee_number: string;
    national_id?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    marital_status?: string | null;
    personal_phone?: string | null;
    home_address_line_1?: string | null;
    home_address_line_2?: string | null;
    city?: string | null;
    state_province?: string | null;
    postal_code?: string | null;
    country?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    department_id?: number | null;
    job_title_id?: number | null;
    line_manager_user_id?: number | null;
    approving_manager_user_id?: number | null;
    employment_status: string;
    employment_type?: string | null;
    work_location?: string | null;
    hire_date?: string | null;
    probation_end_date?: string | null;
    confirmation_date?: string | null;
    is_review_eligible?: boolean;
    review_eligibility_date?: string | null;
    notes?: string | null;
    is_active: boolean;
    user?: BasicUser | null;
    department?: Department | null;
    job_title?: JobTitle | null;
    line_manager?: BasicUser | null;
    approving_manager?: BasicUser | null;
    appraisals?: Appraisal[];
}

export interface EmployeeProfileFormData {
    [key: string]: FormDataConvertible;
    user_id: string;
    employee_number: string;
    national_id: string;
    date_of_birth: string;
    gender: string;
    marital_status: string;
    personal_phone: string;
    home_address_line_1: string;
    home_address_line_2: string;
    city: string;
    state_province: string;
    postal_code: string;
    country: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    department_id: string;
    job_title_id: string;
    line_manager_user_id: string;
    approving_manager_user_id: string;
    employment_status: string;
    employment_type: string;
    work_location: string;
    hire_date: string;
    probation_end_date: string;
    confirmation_date: string;
    is_review_eligible: boolean;
    review_eligibility_date: string;
    notes: string;
    is_active: boolean;
    role_ids: number[];
}

export interface ReviewCycle {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    start_date: string;
    end_date: string;
    goal_setting_deadline?: string | null;
    self_assessment_deadline?: string | null;
    manager_review_deadline?: string | null;
    approval_deadline?: string | null;
    status: string;
    opened_at?: string | null;
    closed_at?: string | null;
    appraisals_count?: number;
}

export interface ObjectiveEvidence {
    id: number;
    appraisal_objective_id: number;
    evidence_type: string;
    url?: string | null;
    path?: string | null;
    original_name?: string | null;
    notes?: string | null;
}

export interface Objective {
    id: number;
    appraisal_id: number;
    perspective_id: number;
    goal_library_item_id?: number | null;
    objective_type?: string | null;
    title: string;
    kpi_measure?: string | null;
    target_definition?: string | null;
    weight: number;
    evidence_source?: string | null;
    due_date?: string | null;
    performance_achieved?: string | null;
    employee_comment?: string | null;
    manager_comment?: string | null;
    self_rating_scale_level_id?: number | null;
    self_rating_score?: number | null;
    manager_rating_scale_level_id?: number | null;
    manager_rating_score?: number | null;
    include_in_business_score: boolean;
    sort_order: number;
    perspective?: Perspective | null;
    self_rating_level?: RatingScaleLevel | null;
    manager_rating_level?: RatingScaleLevel | null;
    evidences?: ObjectiveEvidence[];
}

export interface CompetencyRating {
    id: number;
    appraisal_id: number;
    competency_id: number;
    self_rating_scale_level_id?: number | null;
    self_rating_score?: number | null;
    manager_rating_scale_level_id?: number | null;
    manager_rating_score?: number | null;
    employee_comment?: string | null;
    manager_comment?: string | null;
    sort_order: number;
    competency?: Competency | null;
    self_rating_level?: RatingScaleLevel | null;
    manager_rating_level?: RatingScaleLevel | null;
}

export interface AppraisalComment {
    id: number;
    comment_type: string;
    body: string;
    author?: BasicUser | null;
    created_at?: string;
}

export interface AppraisalApproval {
    id: number;
    stage: string;
    action: string;
    comments?: string | null;
    acted_at?: string | null;
    actor?: BasicUser | null;
}

export interface AppraisalStatusHistory {
    id: number;
    from_status?: string | null;
    to_status: string;
    reason?: string | null;
    changed_at?: string | null;
    actor?: BasicUser | null;
}

export interface DevelopmentPlanAction {
    id?: number;
    action: string;
    owner_user_id?: number | null;
    due_date?: string | null;
    status?: string | null;
    follow_up_status?: string | null;
    completed_at?: string | null;
    owner?: BasicUser | null;
}

export interface DevelopmentPlan {
    id: number;
    appraisal_id: number;
    strengths?: string | null;
    improvement_areas?: string | null;
    follow_up_notes?: string | null;
    actions?: DevelopmentPlanAction[];
}

export interface Appraisal {
    id: number;
    review_cycle_id: number;
    employee_profile_id: number;
    template_id: number;
    employee_user_id: number;
    line_manager_user_id?: number | null;
    approving_manager_user_id?: number | null;
    status: string;
    reopened_stage?: string | null;
    business_weight_percent: number;
    values_weight_percent: number;
    business_score?: number | null;
    values_score?: number | null;
    overall_score?: number | null;
    goal_submitted_at?: string | null;
    self_assessment_submitted_at?: string | null;
    manager_reviewed_at?: string | null;
    approved_at?: string | null;
    finalized_at?: string | null;
    employee_name_snapshot: string;
    employee_email_snapshot: string;
    employee_number_snapshot: string;
    department_name_snapshot?: string | null;
    job_title_name_snapshot?: string | null;
    cycle_name_snapshot: string;
    template_name_snapshot: string;
    review_cycle?: ReviewCycle | null;
    employee_profile?: EmployeeProfile | null;
    template?: Template | null;
    employee?: BasicUser | null;
    line_manager?: BasicUser | null;
    approving_manager?: BasicUser | null;
    overall_rating_level?: RatingScaleLevel | null;
    objectives?: Objective[];
    competency_ratings?: CompetencyRating[];
    comments?: AppraisalComment[];
    approvals?: AppraisalApproval[];
    status_histories?: AppraisalStatusHistory[];
    development_plan?: DevelopmentPlan | null;
}

export interface RoleRecord {
    id: number;
    name: string;
    guard_name?: string;
    permissions?: Array<{ id: number; name: string }>;
    users?: BasicUser[];
}
