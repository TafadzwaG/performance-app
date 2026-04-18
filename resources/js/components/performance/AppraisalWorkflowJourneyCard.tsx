import AppraisalWorkflowStepper from '@/components/performance/AppraisalWorkflowStepper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Workflow } from 'lucide-react';

interface AppraisalWorkflowJourneyCardProps {
    appraisalId: number;
    status: string;
    reopenedStage?: string | null;
    stageAccess: Record<string, boolean>;
}

export default function AppraisalWorkflowJourneyCard({
    appraisalId,
    status,
    reopenedStage,
    stageAccess,
}: AppraisalWorkflowJourneyCardProps) {
    return (
        <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Workflow className="h-4.5 w-4.5" />
                    Workflow Journey
                </CardTitle>
                <CardDescription>
                    Track the appraisal stage from planning through approval, calibration, and finalization.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
                <div className="rounded-2xl border bg-background p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Gauge className="h-4 w-4 text-primary" />
                        Current progress
                    </div>
                    <AppraisalWorkflowStepper
                        status={status}
                        appraisalId={appraisalId}
                        reopenedStage={reopenedStage}
                        stageAccess={stageAccess}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
