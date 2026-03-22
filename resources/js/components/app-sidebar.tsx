import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BarChart3, BookOpen, ClipboardList, FileText, Folder, LayoutGrid, RefreshCw, Settings2, Shield, Users } from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        url: '/users',
        icon: Folder,
    },
   
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.permissions ?? [];
    const can = (...required: string[]) => required.some((permission) => permissions.includes(permission));

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        ...(can(
            'performance.setup.departments.view',
            'performance.setup.job_titles.view',
            'performance.setup.perspectives.view',
            'performance.setup.competencies.view',
            'performance.setup.rating_scales.view',
        )
            ? [
                  {
                      title: 'Setup',
                      url: '/performance/setup/departments',
                      icon: Settings2,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.employees.view', 'performance.employees.create', 'performance.employees.update')
            ? [
                  {
                      title: 'Employees',
                      url: '/performance/employees',
                      icon: Users,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.review_cycles.view', 'performance.review_cycles.create', 'performance.review_cycles.update', 'performance.review_cycles.assign_employees')
            ? [
                  {
                      title: 'Review Cycles',
                      url: '/performance/review-cycles',
                      icon: RefreshCw,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.templates.view', 'performance.templates.create', 'performance.templates.update')
            ? [
                  {
                      title: 'Templates',
                      url: '/performance/templates',
                      icon: ClipboardList,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.goal_library.view', 'performance.goal_library.create', 'performance.goal_library.update')
            ? [
                  {
                      title: 'Goal Library',
                      url: '/performance/goal-library',
                      icon: BookOpen,
                  } satisfies NavItem,
              ]
            : []),
        ...(can(
            'performance.appraisals.view_all',
            'performance.appraisals.view_own',
            'performance.appraisals.plan_own',
            'performance.appraisals.plan_manage',
            'performance.appraisals.self_assess',
            'performance.appraisals.manager_review',
            'performance.appraisals.approve',
            'performance.appraisals.finalize',
        )
            ? [
                  {
                      title: 'Appraisals',
                      url: '/performance/appraisals',
                      icon: FileText,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.development_plans.view', 'performance.development_plans.update')
            ? [
                  {
                      title: 'Development Plans',
                      url: '/performance/development-plans',
                      icon: ClipboardList,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.reports.view', 'performance.reports.export', 'performance.reports.print')
            ? [
                  {
                      title: 'Reports',
                      url: '/performance/reports',
                      icon: BarChart3,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('access.users.view', 'access.users.update')
            ? [
                  {
                      title: 'Access Users',
                      url: '/access/users',
                      icon: Users,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('access.roles.view', 'access.roles.create', 'access.roles.update')
            ? [
                  {
                      title: 'Access Roles',
                      url: '/access/roles',
                      icon: Shield,
                  } satisfies NavItem,
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
