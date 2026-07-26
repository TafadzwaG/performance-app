import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type SharedData } from '@/types';
import { issueTypeLabels, type IssueType } from '@/types/issues';
import { useForm, usePage } from '@inertiajs/react';
import { LifeBuoy, Loader2, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const issueTypes = Object.entries(issueTypeLabels) as Array<[IssueType, string]>;

const selectClassName =
    'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function ReportIssueBubble({ variant = 'floating' }: { variant?: 'floating' | 'sidebar' }) {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.permissions ?? [];
    const roles = auth.roles ?? [];
    const canReportIssue =
        auth.canReportIssue === true ||
        roles.some((role) => role.toLowerCase() === 'super admin') ||
        permissions.some((permission) => ['issues.create', 'issues.view_own', 'issues.view_all'].includes(permission));
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        type: IssueType | '';
        title: string;
        description: string;
    }>({
        type: '',
        title: '',
        description: '',
    });

    if (!auth.user || !canReportIssue) {
        return null;
    }

    const setDialogOpen = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (!nextOpen) {
            clearErrors();
            reset();
        }
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('issues.store'), {
            preserveScroll: true,
            onSuccess: () => setDialogOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setDialogOpen}>
            {variant === 'sidebar' ? (
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DialogTrigger asChild>
                            <SidebarMenuButton
                                type="button"
                                tooltip="Report an issue"
                                aria-label="Report an issue"
                                className="bg-brand-ink text-brand-cream hover:bg-brand-pine hover:text-brand-cream active:bg-brand-pine active:text-brand-cream dark:bg-brand-ink dark:text-brand-cream dark:hover:bg-brand-pine font-medium"
                            >
                                <LifeBuoy />
                                <span>Report an issue</span>
                            </SidebarMenuButton>
                        </DialogTrigger>
                    </SidebarMenuItem>
                </SidebarMenu>
            ) : (
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="bg-brand-ink text-brand-cream hover:bg-brand-pine focus-visible:outline-brand-pine fixed right-5 bottom-5 z-50 flex items-center gap-2.5 rounded-full px-5 py-3 text-[12px] font-medium tracking-wide shadow-[0_18px_40px_-12px_rgba(37,38,39,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-12px_rgba(37,38,39,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:right-8 lg:bottom-8"
                        aria-label="Report an issue"
                    >
                        <span className="bg-brand-sand text-brand-ink relative flex h-6 w-6 items-center justify-center rounded-full">
                            <LifeBuoy className="h-3.5 w-3.5" />
                            <span className="bg-brand-sand absolute inset-0 animate-brand-pulse-ring rounded-full" />
                        </span>
                        <span className="font-mono-brand text-[10px] tracking-[0.18em] uppercase">Report an issue</span>
                    </button>
                </DialogTrigger>
            )}

            <DialogContent
                className="bg-card w-[calc(100vw-2rem)] sm:max-w-5xl"
                onEscapeKeyDown={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogHeader className="border-foreground/10 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-sand/20 text-brand-ink flex h-10 w-10 items-center justify-center rounded-md">
                            <LifeBuoy className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.22em] uppercase">
                                Support request
                            </div>
                            <DialogTitle className="font-display mt-1 text-2xl font-light tracking-tight">
                                Report an issue
                            </DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-foreground/70 mt-3 text-[13px] leading-relaxed">
                        Describe the issue so the support team can assign a handler and track it through to completion.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5 pt-1">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="report-issue-type">Issue type</Label>
                            <select
                                id="report-issue-type"
                                className={selectClassName}
                                value={data.type}
                                onChange={(event) => setData('type', event.target.value as IssueType)}
                                required
                            >
                                <option value="">Select issue type</option>
                                {issueTypes.map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {errors.type ? <p className="text-sm text-red-600">{errors.type}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="report-issue-title">Title / summary</Label>
                            <Input
                                id="report-issue-title"
                                value={data.title}
                                onChange={(event) => setData('title', event.target.value)}
                                placeholder="Brief summary of the issue"
                                required
                            />
                            {errors.title ? <p className="text-sm text-red-600">{errors.title}</p> : null}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="report-issue-description">Description</Label>
                        <textarea
                            id="report-issue-description"
                            rows={7}
                            className="min-h-[11rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            placeholder="What happened, where did it happen, and what did you expect instead?"
                            required
                        />
                        {errors.description ? <p className="text-sm text-red-600">{errors.description}</p> : null}
                    </div>

                    <div className="border-foreground/10 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
                        <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit issue
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
