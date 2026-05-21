import { Badge } from '@/components/ui/badge';
import type { AppraisalComment } from '@/types/performance';
import { AlertTriangle, CornerUpLeft, MessageSquare, Sparkles, Trophy, User } from 'lucide-react';

interface SelfAssessmentNotesPanelProps {
    achievementNote: string;
    significantIssue: string;
    comments?: AppraisalComment[];
    onAchievementChange?: (value: string) => void;
    onIssueChange?: (value: string) => void;
    editable?: boolean;
}

const MAX_NOTE_LENGTH = 4000;

function unwrapCommentType(type: AppraisalComment['comment_type']): string {
    if (type === null || type === undefined) {
        return '';
    }
    if (typeof type === 'object' && type !== null && 'value' in type) {
        return String((type as { value: unknown }).value ?? '');
    }
    return String(type);
}

function formatCommentTypeLabel(type: string): string {
    return type.replace(/_/g, ' ');
}

function NoteField({
    id,
    title,
    description,
    placeholder,
    hint,
    value,
    onChange,
    icon: Icon,
    editable,
}: {
    id: string;
    title: string;
    description: string;
    placeholder: string;
    hint: string;
    value: string;
    onChange?: (value: string) => void;
    icon: typeof Trophy;
    editable: boolean;
}) {
    const length = value.length;
    const hasContent = length > 0;

    return (
        <div className="flex h-full flex-col rounded-2xl border bg-background shadow-sm">
            <div className="flex items-start gap-3 border-b bg-muted/20 px-4 py-4">
                <span className="bg-background text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm">
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
                {editable ? (
                    <>
                        <textarea
                            id={id}
                            className="min-h-36 flex-1 resize-y rounded-xl border border-input bg-muted/20 px-3 py-3 text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            placeholder={placeholder}
                            value={value}
                            maxLength={MAX_NOTE_LENGTH}
                            onChange={(event) => onChange?.(event.target.value)}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>{hint}</span>
                            <span className={length > MAX_NOTE_LENGTH * 0.9 ? 'text-foreground font-medium' : ''}>
                                {length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="min-h-24 rounded-xl border border-dashed bg-muted/10 px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                        {hasContent ? value : <span className="text-muted-foreground italic">Nothing recorded yet.</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SelfAssessmentNotesPanel({
    achievementNote,
    significantIssue,
    comments = [],
    onAchievementChange,
    onIssueChange,
    editable = false,
}: SelfAssessmentNotesPanelProps) {
    const workflowComments = comments.filter((comment) => {
        const type = unwrapCommentType(comment.comment_type);
        return type !== 'achievement_note' && type !== 'significant_issue';
    });

    return (
        <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
                <NoteField
                    id="achievement_note"
                    title="Other substantial achievements"
                    description="Highlight wins, projects, or contributions beyond your stated objectives."
                    placeholder="e.g. Led the Q3 onboarding refresh, mentored two new hires, reduced support backlog by 30%..."
                    hint="Optional — helps your manager see the full picture of your year."
                    value={achievementNote}
                    onChange={onAchievementChange}
                    icon={Trophy}
                    editable={editable}
                />
                <NoteField
                    id="significant_issue"
                    title="Significant issues"
                    description="Note material challenges, risks, or blockers that affected your performance."
                    placeholder="e.g. Extended system outage in March, role change mid-cycle, resource constraints on key deliverables..."
                    hint="Optional — be factual; this is not a place for objective-level ratings."
                    value={significantIssue}
                    onChange={onIssueChange}
                    icon={AlertTriangle}
                    editable={editable}
                />
            </div>

            {workflowComments.length > 0 ? (
                <div className="space-y-3 rounded-2xl border bg-muted/15 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <MessageSquare className="text-muted-foreground h-4 w-4" />
                        <h4 className="text-sm font-semibold text-foreground">Feedback on this appraisal</h4>
                        <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                            {workflowComments.length} comment{workflowComments.length === 1 ? '' : 's'}
                        </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Notes from managers or approvers when the appraisal was returned. Your achievement and issue fields above are separate.
                    </p>
                    <div className="space-y-3">
                        {workflowComments.map((comment) => {
                            const type = unwrapCommentType(comment.comment_type);
                            const isSendBack = type === 'send_back';

                            return (
                                <div key={comment.id} className="rounded-xl border bg-background p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="gap-1 px-2 py-0.5 text-[11px] capitalize">
                                            {isSendBack ? <CornerUpLeft className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                            {formatCommentTypeLabel(type || 'comment')}
                                        </Badge>
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <User className="h-3.5 w-3.5" />
                                            {comment.author?.name ?? 'System'}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{comment.body}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : editable ? (
                <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                    <Sparkles className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                        Both fields are optional. Add context that objective ratings alone do not capture — managers review this with your
                        goal scores.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
