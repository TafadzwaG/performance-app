import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavProfile } from '@/components/nav-profile';
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
    SidebarMenuBadge,
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
    Clock3,
    FilePlus2,
    FileText,
    Gauge,
    HardDrive,
    History,
    LayoutGrid,
    LifeBuoy,
    LogOut,
    RefreshCw,
    Settings2,
    Shield,
    SlidersHorizontal,
    Target,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth, nav } = usePage<SharedData>().props;
    const permissions = auth.permissions ?? [];
    const roles = auth.roles ?? [];
    const can = (...required: string[]) => required.some((permission) => permissions.includes(permission));
    const isSuperAdminRole = roles.some((role) => role.toLowerCase() === 'super admin');
    const isEmployeeRole = roles.some((role) => role.toLowerCase() === 'employee');
    const showMyKpisNav = nav?.showMyKpis === true;
    const impersonation = auth.impersonation;
    const employeesCount = typeof nav?.employeesCount === 'number' ? nav.employeesCount : null;
    const pendingAppraisalsCount =
        typeof nav?.pendingAppraisalsCount === 'number' ? nav.pendingAppraisalsCount : null;
    const showPendingAppraisalsNav = pendingAppraisalsCount !== null;
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
                      title: 'Values',
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
        ...(can('performance.employees.configure_fields')
            ? [
                  {
                      title: 'Employee Fields',
                      url: '/performance/setup/employee-fields',
                      icon: Shield,
                  } satisfies NavItem,
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
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
        {
            title: 'Help & Docs',
            url: route('access.help.index'),
            icon: CircleHelp,
        } satisfies NavItem,
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
        ...(can('access.audit_trails.view')
            ? [
                  {
                      title: 'Audit Trail',
                      url: route('access.audit-trails.index'),
                      icon: History,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('access.storage.manage', 'system.settings.manage')
            ? [
                  {
                      title: 'Storage Management',
                      url: route('access.storage.index'),
                      icon: HardDrive,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('system.settings.manage', 'system.disaster_recovery.manage')
            ? [
                  {
                      title: 'Settings',
                      url: route('settings.index'),
                      icon: Settings2,
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
        ...(isSuperAdminRole || can('issues.view_own', 'issues.view_all', 'issues.create')
            ? [
                  {
                      title: 'Issues',
                      url: '/issues',
                      icon: LifeBuoy,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.employees.view', 'performance.employees.create', 'performance.employees.update')
            ? [
                  {
                      title: 'Employees',
                      url: '/performance/employees',
                      icon: Users,
                      badge: employeesCount !== null ? (employeesCount > 99 ? '99+' : employeesCount) : undefined,
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
        ...(showMyKpisNav
            ? [
                  {
                      title: 'My KPIs',
                      url: '/performance/my-kpis',
                      icon: Target,
                  } satisfies NavItem,
              ]
            : []),
        ...(can('performance.goal_library.view', 'performance.goal_library.create', 'performance.goal_library.update') && !isEmployeeRole
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
        ...(!isEmployeeRole && can('performance.reports.view', 'performance.reports.export', 'performance.reports.print')
            ? [
                  {
                      title: 'Reports',
                      url: '/performance/reports',
                      icon: BarChart3,
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

            <SidebarContent className="pt-4">
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

                {showPendingAppraisalsNav ? (
                    <SidebarGroup className="px-2 pt-2 pb-1">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    size="lg"
                                    tooltip="Pending appraisals"
                                    className="border border-sidebar-border/80 bg-sidebar-accent/50 font-medium shadow-sm transition-all hover:bg-sidebar-accent hover:shadow-md"
                                >
                                    <Link
                                        href={route('performance.appraisals.index', { needs_action: 1 })}
                                        prefetch
                                    >
                                        <Clock3 className="!size-4 shrink-0" />
                                        <span className="font-display tracking-tight text-[15px] group-data-[collapsible=icon]:hidden">
                                            Pending appraisals
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                                {pendingAppraisalsCount > 0 ? (
                                    <SidebarMenuBadge className="h-5 min-w-5 rounded-full bg-destructive px-1.5 text-[0.6875rem] font-semibold text-destructive-foreground">
                                        {pendingAppraisalsCount > 99 ? '99+' : pendingAppraisalsCount}
                                    </SidebarMenuBadge>
                                ) : null}
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                ) : null}

                {can('performance.review_cycles.assign_employees', 'performance.appraisals.view_all') ? (
                    <SidebarGroup className="px-2 pt-2 pb-1">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    size="lg"
                                    tooltip="Create an appraisal"
                                    className="bg-brand-sand text-brand-ink hover:bg-brand-sand/90 hover:text-brand-ink dark:bg-brand-sand dark:text-brand-ink dark:hover:bg-brand-sand/90 group-data-[collapsible=icon]:p-2! border border-brand-sand/40 font-medium shadow-sm transition-all hover:-translate-y-px hover:shadow-md focus-visible:ring-brand-sand"
                                >
                                    <Link href="/performance/appraisals/create" prefetch>
                                        <FilePlus2 className="!size-4 shrink-0" />
                                        <span className="font-display tracking-tight text-[15px] group-data-[collapsible=icon]:hidden">
                                            Create an appraisal
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                ) : null}

                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavProfile />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
