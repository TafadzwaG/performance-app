import AppraisalSteps, { AppraisalStepSubmitActions } from '@/components/performance/AppraisalSteps';
import PerformancePage from '@/components/performance/PerformancePage';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Appraisal } from '@/types/performance';
import { router, useForm, usePage } from '@inertiajs/react';
import { ClipboardList, LayoutDashboard, Loader2, Lock, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    appraisal: Appraisal;
    abilities: Record<string, boolean>;
}

type FinalizeModalStep = 'confirm' | 'next_steps';

const breadcrumbs = (appraisal: Appraisal): BreadcrumbItem[] => [
    { title: 'Performance', href: '/performance/dashboard' },
    { title: 'Appraisals', href: route('performance.appraisals.index') },
    { title: appraisal.employee_name_snapshot, href: route('performance.appraisals.show', appraisal.id) },
    { title: 'Finalize', href: route('performance.appraisals.finalize', appraisal.id) },
];

export default function Finalize({ appraisal, abilities }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const [draftSaved, setDraftSaved] = useState(false);
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
    const [finalizeModalStep, setFinalizeModalStep] = useState<FinalizeModalStep>('confirm');
    const hasGoals = (appraisal.objectives ?? []).length > 0;
    const canOpenDevelopmentPlan =
        auth.permissions.includes('performance.development_plans.view') || auth.permissions.includes('performance.development_plans.update');
    const isFinalized = appraisal.status === 'finalized';
    const { data, setData, post, processing } = useForm({
        comment: '',
    });
    const hydratedFromStorage = useRef(false);
    const draftStorageKey = useMemo(() => `performance:appraisals:finalize:draft:${appraisal.id}`, [appraisal.id]);
    const initialDraftSnapshot = useMemo(() => JSON.stringify({ comment: '' }), []);

    useEffect(() => {
        if (!flash.showFinalizeNextSteps) {
            return;
        }

        setFinalizeModalStep('next_steps');
        setFinalizeModalOpen(true);
    }, [flash.showFinalizeNextSteps]);

    useEffect(() => {
        if (typeof window === 'undefined' || hydratedFromStorage.current) return;
        const raw = window.localStorage.getItem(draftStorageKey);
        if (!raw) {
            hydratedFromStorage.current = true;
            return;
        }
        try {
            const parsed = JSON.parse(raw) as Partial<typeof data>;
            (Object.keys(parsed) as Array<keyof typeof data>).forEach((key) => {
                const value = parsed[key];
                if (value !== undefined) setData(key, value);
            });
            setDraftSaved(true);
        } catch {
            window.localStorage.removeItem(draftStorageKey);
        } finally {
            hydratedFromStorage.current = true;
        }
    }, [draftStorageKey, setData]);

    useEffect(() => {
        if (typeof window === 'undefined' || !hydratedFromStorage.current) return;
        const serialized = JSON.stringify(data);
        if (serialized === initialDraftSnapshot) {
            window.localStorage.removeItem(draftStorageKey);
            setDraftSaved(false);
            return;
        }
        window.localStorage.setItem(draftStorageKey, serialized);
        setDraftSaved(true);
    }, [data, draftStorageKey, initialDraftSnapshot]);

    const openFinalizeConfirmModal = () => {
        setFinalizeModalStep('confirm');
        setFinalizeModalOpen(true);
    };

    const submitFinalization = () => {
        post(route('performance.appraisals.finalize.store', appraisal.id), {
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(draftStorageKey);
                }
                setDraftSaved(false);
            },
            onError: () => {
                setFinalizeModalStep('confirm');
                setFinalizeModalOpen(true);
            },
        });
    };

    const goToDevelopmentPlan = () => {
        setFinalizeModalOpen(false);
        router.visit(route('performance.development_plans.edit', appraisal.id));
    };

    const goToDashboard = () => {
        setFinalizeModalOpen(false);
        router.visit(route('performance.dashboard'));
    };

    return (
        <PerformancePage
            title="Finalize Appraisal"
            description="Lock the final result and release the final print pack."
            breadcrumbs={breadcrumbs(appraisal)}
        >
            <AppraisalSteps
                appraisal={appraisal}
                abilities={abilities}
                hasGoals={hasGoals}
                canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                currentStepKey="final_record"
                showStartButton={false}
            />

            <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-12">
                    <Card className="border-0 shadow-md">
                        <CardHeader
                            className="bg-muted/20 border-b"
                            style={{
                                margin: '10px',
                            }}
                        >
                            <CardTitle>Finalization Note</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted/20 text-muted-foreground rounded-2xl border p-4 text-sm">
                                Finalization is read-only for scores and ratings. If the outcome needs to change, it must be sent back before
                                finalization.
                            </div>
                            {appraisal.latest_calibration ? (
                                <div className="bg-background rounded-2xl border p-4">
                                    <div className="text-foreground text-sm font-medium">Calibration Summary</div>
                                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                                        <div>
                                            <div className="text-muted-foreground text-xs tracking-wide uppercase">Committee decision</div>
                                            <div className="text-foreground mt-1 text-sm font-medium">
                                                {String(appraisal.latest_calibration.decision ?? '').replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs tracking-wide uppercase">Reviewed by</div>
                                            <div className="text-foreground mt-1 text-sm font-medium">
                                                {appraisal.calibrated_by?.name ?? appraisal.latest_calibration.actor?.name ?? 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-muted-foreground mt-3 text-sm">
                                        {appraisal.calibration_comment ?? appraisal.latest_calibration.comments}
                                    </div>
                                </div>
                            ) : null}
                            <textarea
                                className="bg-background min-h-28 w-full rounded-md border px-3 py-2"
                                value={data.comment}
                                onChange={(event) => setData('comment', event.target.value)}
                                readOnly={isFinalized}
                            />
                            <AppraisalStepSubmitActions
                                stepKey="final_record"
                                appraisal={appraisal}
                                abilities={abilities}
                                hasGoals={hasGoals}
                                canOpenDevelopmentPlan={canOpenDevelopmentPlan}
                            >
                                <Button type="button" onClick={openFinalizeConfirmModal} disabled={processing || isFinalized}>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Finalize Appraisal
                                </Button>
                            </AppraisalStepSubmitActions>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog
                open={finalizeModalOpen}
                onOpenChange={(open) => {
                    if (!processing) {
                        setFinalizeModalOpen(open);
                        if (!open && finalizeModalStep === 'confirm') {
                            setFinalizeModalStep('confirm');
                        }
                    }
                }}
            >
                <AlertDialogContent className="max-w-lg">
                    {finalizeModalStep === 'confirm' ? (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-primary" />
                                    Finalize this appraisal?
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-3 text-left text-sm leading-6 text-muted-foreground">
                                        <p className="text-foreground">
                                            This will lock the appraisal for {appraisal.employee_name_snapshot} as the final record. Scores and
                                            ratings can no longer be changed.
                                        </p>
                                        {String(data.comment ?? '').trim() ? (
                                            <p>Your finalization note will be saved with this action.</p>
                                        ) : (
                                            <p>You can add an optional finalization note before continuing.</p>
                                        )}
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
                                <Button type="button" onClick={submitFinalization} disabled={processing}>
                                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                    {processing ? 'Finalizing…' : 'Finalize appraisal'}
                                </Button>
                            </AlertDialogFooter>
                        </>
                    ) : (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Appraisal finalized
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-3 text-left text-sm leading-6 text-muted-foreground">
                                        <p className="text-foreground">
                                            The appraisal has been locked successfully. Where would you like to go next?
                                        </p>
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
                                {canOpenDevelopmentPlan ? (
                                    <Button type="button" className="w-full justify-start" onClick={goToDevelopmentPlan}>
                                        <ClipboardList className="mr-2 h-4 w-4" />
                                        Go to development plan
                                    </Button>
                                ) : null}
                                <Button type="button" variant={canOpenDevelopmentPlan ? 'outline' : 'default'} className="w-full justify-start" onClick={goToDashboard}>
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Go to dashboard
                                </Button>
                            </AlertDialogFooter>
                        </>
                    )}
                </AlertDialogContent>
            </AlertDialog>
        </PerformancePage>
    );
}
