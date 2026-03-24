import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Briefcase,
    Building2,
    CircleHelp,
    ClipboardList,
    FileText,
    Gauge,
    History,
    LayoutGrid,
    LogOut,
    RefreshCw,
    Shield,
    SlidersHorizontal,
    Target,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.permissions ?? [];
    const can = (...required: string[]) => required.some((permission) => permissions.includes(permission));
    const impersonation = auth.impersonation;
    const setupItems: NavItem[] = [
        ...(can('performance.setup.departments.view')
            ? [
                  {
                      title: 'Departments',
                      url: '/performance/setup/departments',
                      icon: Building2,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.setup.job_titles.view')
            ? [
                  {
                      title: 'Job Titles',
                      url: '/performance/setup/job-titles',
                      icon: Briefcase,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.setup.perspectives.view')
            ? [
                  {
                      title: 'Perspectives',
                      url: '/performance/setup/perspectives',
                      icon: Target,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.setup.competencies.view')
            ? [
                  {
                      title: 'Competencies',
                      url: '/performance/setup/competencies',
                      icon: Gauge,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.setup.rating_scales.view')
            ? [
                  {
                      title: 'Rating Scales',
                      url: '/performance/setup/rating-scales',
                      icon: SlidersHorizontal,
                  } satisfies NavItem,
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Help & Docs',
            url: route('access.help.index'),
            icon: CircleHelp,
        } satisfies NavItem,
        ...(can('access.audit_trails.view')
            ? [
                  {
                      title: 'Audit Trail',
                      url: route('access.audit-trails.index'),
                      icon: History,
                  } satisfies NavItem,
              ]
            : []),
    ];

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        ...(setupItems.length > 0
            ? [
                  {
                      title: 'Setup',
                      url: '/performance/setup/departments',
                      icon: Building2,
                      items: setupItems,
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
        ...(can('access.users.view', 'access.users.create', 'access.users.update', 'access.users.import')
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
                {impersonation?.isImpersonating && (
                    <SidebarGroup className="pb-0">
                        <SidebarGroupLabel>Impersonation</SidebarGroupLabel>
                        <SidebarGroupContent className="space-y-2">
                            <div className="rounded-md border border-sidebar-border/70 bg-sidebar-accent/40 px-2.5 py-2 text-xs leading-5 text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
                                <div className="font-medium text-sidebar-foreground">Impersonating {auth.user.name}</div>
                                <div>Original session: {impersonation.impersonator?.name ?? 'Unknown user'}</div>
                            </div>

                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        type="button"
                                        tooltip="Stop impersonating"
                                        onClick={() =>
                                            router.delete(route('access.impersonation.destroy'), {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        <LogOut />
                                        <span>Stop Impersonating</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
