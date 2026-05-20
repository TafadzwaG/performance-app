import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Compass,
    Lightbulb,
    LogIn,
    MoveRight,
    PartyPopper,
    Sparkles,
    Target,
    UserPlus,
    Users,
    Wand2,
} from 'lucide-react';
import * as React from 'react';

type Step = {
    n: string;
    icon: React.ElementType;
    title: string;
    body: string;
    note?: string;
};

const steps: Step[] = [
    {
        n: '01',
        icon: LogIn,
        title: 'Sign in to the studio',
        body: 'Use your work email and password. New here? Ask your administrator to create an account.',
        note: 'Single sign-on available on enterprise plans.',
    },
    {
        n: '02',
        icon: UserPlus,
        title: 'Complete your profile',
        body: 'Add your role, reporting line, and skills. This anchors every review to who you actually are.',
    },
    {
        n: '03',
        icon: Target,
        title: 'Set up the cycle',
        body: 'Choose a cadence (quarterly, biannual, rolling), weightings, and values framework.',
        note: 'Admins can clone last cycle and adjust.',
    },
    {
        n: '04',
        icon: Compass,
        title: 'Define goals & KRs',
        body: 'Cascade from executive priorities down to individual key results. Each goal owns its evidence.',
    },
    {
        n: '05',
        icon: Users,
        title: 'Capture feedback continuously',
        body: 'Self-assessments, peer reviews, manager 1:1 notes — all tied to objectives, not memory.',
    },
    {
        n: '06',
        icon: Sparkles,
        title: 'Calibrate & close',
        body: 'Run calibration, finalise ratings, share growth plans. Decisions you can defend.',
    },
];

interface GetStartedPopoverProps {
    triggerVariant?: 'floating' | 'inline' | 'compact';
    initialOpen?: boolean;
}

export function GetStartedPopover({ triggerVariant = 'floating', initialOpen = false }: GetStartedPopoverProps) {
    const [open, setOpen] = React.useState(initialOpen);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerVariant === 'floating' ? (
                    <button
                        type="button"
                        className="bg-brand-ink text-brand-cream hover:bg-brand-pine focus-visible:outline-brand-pine animate-brand-rise fixed right-5 bottom-5 z-50 flex items-center gap-2.5 rounded-full px-5 py-3 text-[12px] font-medium tracking-wide shadow-[0_18px_40px_-12px_rgba(37,38,39,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-12px_rgba(37,38,39,0.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:right-8 lg:bottom-8"
                        aria-label="How to get started"
                    >
                        <span className="bg-brand-sand text-brand-ink relative flex h-6 w-6 items-center justify-center rounded-full">
                            <Lightbulb className="h-3.5 w-3.5" />
                            <span className="bg-brand-sand absolute inset-0 animate-brand-pulse-ring rounded-full" />
                        </span>
                        <span className="font-mono-brand text-[10px] tracking-[0.18em] uppercase">How to get started</span>
                    </button>
                ) : triggerVariant === 'compact' ? (
                    <Button variant="ghost" size="sm" className="font-mono-brand text-[10px] tracking-[0.18em] uppercase">
                        <Lightbulb className="h-3.5 w-3.5" />
                        How to get started
                    </Button>
                ) : (
                    <Button variant="outline" size="lg">
                        <Lightbulb />
                        How to get started
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="bg-card sm:max-w-2xl">
                <DialogHeader className="border-foreground/10 border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-sand/20 text-brand-ink flex h-10 w-10 items-center justify-center rounded-md">
                            <Wand2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.22em] uppercase">
                                § Onboarding · 6 steps
                            </div>
                            <DialogTitle className="font-display mt-1 text-2xl font-light tracking-tight">
                                How to get started
                            </DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="text-foreground/70 mt-3 text-[13px] leading-relaxed">
                        A short walkthrough — about ten minutes from sign-in to first goal. You can leave and resume at
                        any step; nothing is lost.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[55vh] overflow-y-auto pr-1">
                    <ol className="space-y-3 py-2">
                        {steps.map((step) => (
                            <li
                                key={step.n}
                                className="group border-foreground/10 hover:border-brand-sand bg-background relative flex gap-4 rounded-lg border p-4 transition-colors"
                            >
                                <div
                                    className="font-display text-brand-sand shrink-0 text-3xl leading-none font-light"
                                    aria-hidden
                                >
                                    {step.n}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <step.icon className="text-foreground h-4 w-4" />
                                        <h3 className="font-display text-lg">{step.title}</h3>
                                    </div>
                                    <p className="text-foreground/70 mt-1 text-[13px] leading-relaxed">{step.body}</p>
                                    {step.note ? (
                                        <p className="text-foreground/50 font-mono-brand mt-2 text-[10px] tracking-[0.15em] uppercase">
                                            Note · {step.note}
                                        </p>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="border-foreground/10 mt-2 flex flex-col-reverse items-stretch gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-foreground/60 flex items-center gap-2 text-[12px]">
                        <PartyPopper className="text-brand-pine h-4 w-4" />
                        Takes about 10 minutes end-to-end.
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Maybe later
                        </Button>
                        <Button asChild>
                            <Link href={route('login')}>
                                Begin now
                                <MoveRight />
                            </Link>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* -------------------------------------------------------------------
 * Inline help popover — used for contextual tips (e.g. next to a section heading).
 * Uses radix popover so it positions correctly inline.
 * ------------------------------------------------------------------- */

interface InlineHintProps {
    title: string;
    body: string;
    icon?: React.ElementType;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InlineHint({ title, body, icon: Icon = BookOpen, side = 'top' }: InlineHintProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="border-foreground/20 bg-background text-foreground/75 hover:border-brand-sand hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors"
                    aria-label={title}
                >
                    <Icon className="h-3 w-3" />
                </button>
            </PopoverTrigger>
            <PopoverContent side={side} className="bg-card border-foreground/15 w-72 p-4">
                <div className="font-mono-brand text-foreground/60 text-[10px] tracking-[0.22em] uppercase">§ Hint</div>
                <div className="font-display mt-1 text-base">{title}</div>
                <p className="text-foreground/70 mt-2 text-[12px] leading-relaxed">{body}</p>
            </PopoverContent>
        </Popover>
    );
}
