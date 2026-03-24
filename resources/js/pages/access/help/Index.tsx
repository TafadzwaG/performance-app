import PerformancePage from '@/components/performance/PerformancePage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import { BookOpen, Download, FileText, ShieldCheck, Sparkles, Users } from 'lucide-react';

interface HelpDocument {
    slug: string;
    title: string;
    audience: string;
    category: 'manual' | 'technical' | 'diagram';
    description: string;
    tags: string[];
    featured: boolean;
    formats: Array<{
        format: string;
        url: string;
    }>;
}

interface WorkflowStep {
    step: string;
    title: string;
    description: string;
}

interface RoleGuide {
    title: string;
    summary: string;
}

interface Props {
    documents: HelpDocument[];
    workflowSteps: WorkflowStep[];
    roleGuides: RoleGuide[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Help & Docs', href: route('access.help.index') },
];

function iconForDocument(category: HelpDocument['category']) {
    switch (category) {
        case 'technical':
            return <ShieldCheck className="h-5 w-5 text-muted-foreground" />;
        case 'diagram':
            return <Sparkles className="h-5 w-5 text-muted-foreground" />;
        default:
            return <BookOpen className="h-5 w-5 text-muted-foreground" />;
    }
}

export default function HelpIndex({ documents, workflowSteps, roleGuides }: Props) {
    const featuredDocuments = documents.filter((document) => document.featured);
    const roleManuals = documents.filter((document) => document.category === 'manual' && document.audience !== 'All users');
    const generalGuides = documents.filter((document) => document.category !== 'manual' || document.audience === 'All users');

    return (
        <PerformancePage
            title="Help & Documentation"
            description="Understand the full system flow, role responsibilities, and download manuals or technical documentation."
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                <Card className="overflow-hidden">
                    <CardHeader className="gap-4">
                        <div className="inline-flex w-fit items-center gap-2 rounded-md border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" />
                            Help Center
                        </div>

                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-semibold tracking-tight">How the System Works</CardTitle>
                            <CardDescription className="max-w-3xl text-sm leading-6">
                                This workspace gives every user one place to understand the appraisal lifecycle, learn their role in the process,
                                and download the latest manuals, flow references, and technical system documentation.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid gap-4 xl:grid-cols-5">
                    {workflowSteps.map((step) => (
                        <Card key={step.step} className="shadow-sm">
                            <CardContent className="space-y-4 p-5">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline">Step {step.step}</Badge>
                                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                                </div>

                                <div>
                                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Featured Downloads</CardTitle>
                            <CardDescription>
                                The most useful references for onboarding, support, governance, and stakeholder communication.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {featuredDocuments.map((document) => (
                                <div key={document.slug} className="rounded-xl border bg-muted/10 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                                    {iconForDocument(document.category)}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">{document.title}</h3>
                                                    <p className="text-xs text-muted-foreground">{document.audience}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm leading-6 text-muted-foreground">{document.description}</p>

                                            <div className="flex flex-wrap gap-2">
                                                {document.tags.map((tag) => (
                                                    <Badge key={tag} variant="outline">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            {document.formats.map((format) => (
                                                <Button key={format.url} asChild variant={format.format === 'PDF' ? 'default' : 'outline'} size="sm">
                                                    <a href={format.url}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        {format.format}
                                                    </a>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Role Quick Guide</CardTitle>
                            <CardDescription>
                                A fast summary of what each role is responsible for inside the appraisal workflow.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {roleGuides.map((guide) => (
                                <div key={guide.title} className="flex items-start gap-4 rounded-xl border bg-muted/10 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">{guide.title}</h3>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{guide.summary}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Role-Based User Manuals</CardTitle>
                            <CardDescription>
                                Download the guide that matches the way you work inside the system.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {roleManuals.map((document) => (
                                <div key={document.slug} className="rounded-xl border bg-muted/10 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-foreground">{document.title}</h3>
                                            <p className="text-xs text-muted-foreground">{document.audience}</p>
                                            <p className="text-sm leading-6 text-muted-foreground">{document.description}</p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            {document.formats.map((format) => (
                                                <Button key={format.url} asChild variant="outline" size="sm">
                                                    <a href={format.url}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        {format.format}
                                                    </a>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Documentation Library</CardTitle>
                            <CardDescription>
                                Full documentation set, including manuals, flow diagrams, and technical references.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {generalGuides.map((document) => (
                                <div key={document.slug} className="rounded-xl border bg-muted/10 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                {iconForDocument(document.category)}
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground">{document.title}</h3>
                                                    <p className="text-xs text-muted-foreground">{document.audience}</p>
                                                </div>
                                            </div>

                                            <p className="text-sm leading-6 text-muted-foreground">{document.description}</p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            {document.formats.map((format) => (
                                                <Button key={format.url} asChild variant="outline" size="sm">
                                                    <a href={format.url}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        {format.format}
                                                    </a>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Support Notes</CardTitle>
                        <CardDescription>
                            Use this page as the first stop when onboarding new users, explaining workflow status changes, or preparing training sessions.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border bg-muted/10 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                For end users
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Start with the General User Manual, then move to the manual that matches the user’s assigned role.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-muted/10 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                For administrators
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Use the Technical Documentation and stakeholder flow diagram when planning governance, scoring, or permissions changes.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-muted/10 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                For training sessions
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                The role manuals and flow diagrams are suitable for onboarding decks, workshops, and quick refresher sessions.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PerformancePage>
    );
}
