<?php

namespace App\Support\Documentation;

class DocumentationLibrary
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return [
            [
                'slug' => 'technical-documentation',
                'title' => 'Technical Documentation',
                'audience' => 'Technical team',
                'category' => 'technical',
                'description' => 'Architecture, workflow, scoring model, permissions, and implementation overview for maintainers and solution owners.',
                'path' => base_path('SYSTEM.md'),
                'formats' => ['pdf', 'md'],
                'download_names' => [
                    'pdf' => 'technical-documentation.pdf',
                    'md' => 'SYSTEM.md',
                ],
                'tags' => ['Architecture', 'Workflow', 'Permissions', 'Scoring'],
                'featured' => true,
            ],
            [
                'slug' => 'general-user-manual',
                'title' => 'General User Manual',
                'audience' => 'All users',
                'category' => 'manual',
                'description' => 'A complete walkthrough of the system navigation, common tasks, workflow stages, and support guidance.',
                'path' => base_path('docs/USER_MANUAL.md'),
                'formats' => ['pdf', 'md'],
                'download_names' => [
                    'pdf' => 'general-user-manual.pdf',
                    'md' => 'USER_MANUAL.md',
                ],
                'tags' => ['Quick Start', 'Navigation', 'Workflow'],
                'featured' => true,
            ],
            [
                'slug' => 'employee-user-manual',
                'title' => 'Employee User Manual',
                'audience' => 'Employees',
                'category' => 'manual',
                'description' => 'Step-by-step guidance for goal planning, self assessment, evidence submission, and development plans.',
                'path' => base_path('docs/manuals/EMPLOYEE_USER_MANUAL.md'),
                'formats' => ['pdf', 'md'],
                'download_names' => [
                    'pdf' => 'employee-user-manual.pdf',
                    'md' => 'EMPLOYEE_USER_MANUAL.md',
                ],
                'tags' => ['Goals', 'Self Assessment', 'Evidence'],
                'featured' => false,
            ],
            [
                'slug' => 'manager-user-manual',
                'title' => 'Manager User Manual',
                'audience' => 'Line Managers',
                'category' => 'manual',
                'description' => 'Instructions for team appraisal review, ratings, comments, send-back handling, and development actions.',
                'path' => base_path('docs/manuals/MANAGER_USER_MANUAL.md'),
                'formats' => ['pdf', 'md'],
                'download_names' => [
                    'pdf' => 'manager-user-manual.pdf',
                    'md' => 'MANAGER_USER_MANUAL.md',
                ],
                'tags' => ['Manager Review', 'Ratings', 'Send Back'],
                'featured' => false,
            ],
            [
                'slug' => 'approving-manager-user-manual',
                'title' => 'Approving Manager User Manual',
                'audience' => 'Approving Managers',
                'category' => 'manual',
                'description' => 'Approval-stage guidance for final review, send-back decisions, and approval governance.',
                'path' => base_path('docs/manuals/APPROVING_MANAGER_USER_MANUAL.md'),
                'formats' => ['pdf', 'md'],
                'download_names' => [
                    'pdf' => 'approving-manager-user-manual.pdf',
                    'md' => 'APPROVING_MANAGER_USER_MANUAL.md',
                ],
                'tags' => ['Approval', 'Escalation', 'Governance'],
                'featured' => false,
            ],
            [
                'slug' => 'hr-admin-user-manual',
                'title' => 'HR Admin User Manual',
                'audience' => 'HR Admins',
                'category' => 'manual',
                'description' => 'Administrative operating guide for setup, employees, cycles, finalization, reports, and data governance.',
                'path' => base_path('docs/manuals/HR_ADMIN_USER_MANUAL.md'),
                'formats' => ['pdf', 'md'],
                'download_names' => [
                    'pdf' => 'hr-admin-user-manual.pdf',
                    'md' => 'HR_ADMIN_USER_MANUAL.md',
                ],
                'tags' => ['Setup', 'Employees', 'Cycles', 'Reports'],
                'featured' => false,
            ],
            [
                'slug' => 'super-admin-user-manual',
                'title' => 'Super Admin / System Owner Manual',
                'audience' => 'System owners',
                'category' => 'manual',
                'description' => 'Operational guidance for RBAC, impersonation, audit trail review, and system oversight.',
                'path' => base_path('docs/manuals/SUPER_ADMIN_USER_MANUAL.md'),
                'formats' => ['pdf', 'md'],
                'download_names' => [
                    'pdf' => 'super-admin-system-owner-manual.pdf',
                    'md' => 'SUPER_ADMIN_USER_MANUAL.md',
                ],
                'tags' => ['RBAC', 'Audit Trail', 'Impersonation'],
                'featured' => false,
            ],
            [
                'slug' => 'system-flow-diagram',
                'title' => 'System Flow Diagram',
                'audience' => 'All users',
                'category' => 'diagram',
                'description' => 'End-to-end operational flow from setup through approval, finalization, and reporting.',
                'path' => base_path('docs/SYSTEM_FLOW_DIAGRAM.pdf'),
                'formats' => ['pdf'],
                'download_names' => [
                    'pdf' => 'SYSTEM_FLOW_DIAGRAM.pdf',
                ],
                'tags' => ['Workflow', 'Reference'],
                'featured' => true,
            ],
            [
                'slug' => 'stakeholder-flow-diagram',
                'title' => 'Stakeholder Flow Diagram',
                'audience' => 'Leadership and stakeholders',
                'category' => 'diagram',
                'description' => 'A cleaner presentation-ready flow diagram for business stakeholders and project sponsors.',
                'path' => base_path('docs/SYSTEM_FLOW_DIAGRAM_STAKEHOLDER.pdf'),
                'formats' => ['pdf'],
                'download_names' => [
                    'pdf' => 'SYSTEM_FLOW_DIAGRAM_STAKEHOLDER.pdf',
                ],
                'tags' => ['Stakeholder', 'Presentation'],
                'featured' => true,
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $slug): ?array
    {
        foreach (self::all() as $document) {
            if ($document['slug'] === $slug) {
                return $document;
            }
        }

        return null;
    }
}
