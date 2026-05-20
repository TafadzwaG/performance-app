import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AppraisalComment } from '@/types/performance';

interface CommentPanelProps {
    comments: AppraisalComment[];
    achievementNote?: string;
    significantIssue?: string;
    onAchievementChange?: (value: string) => void;
    onIssueChange?: (value: string) => void;
    editable?: boolean;
}

export default function CommentPanel({
    comments,
    achievementNote,
    significantIssue,
    onAchievementChange,
    onIssueChange,
    editable = false,
}: CommentPanelProps) {
    return (
        <Card>
            <CardHeader>
                <HeadingSmall title="Comments" description="Narrative notes and workflow comments." />
            </CardHeader>
            <CardContent className="space-y-4">
                {editable ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm">
                            Achievement note
                            <textarea
                                className="min-h-28 rounded-md border bg-background px-3 py-2"
                                value={achievementNote ?? ''}
                                onChange={(event) => onAchievementChange?.(event.target.value)}
                            />
                        </label>
                        <label className="grid gap-2 text-sm">
                            Significant issue
                            <textarea
                                className="min-h-28 rounded-md border bg-background px-3 py-2"
                                value={significantIssue ?? ''}
                                onChange={(event) => onIssueChange?.(event.target.value)}
                            />
                        </label>
                    </div>
                ) : null}

                <div className="space-y-3">
                    {comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border bg-muted/15 p-4">
                            <div className="font-mono-brand text-muted-foreground text-[10px] tracking-[0.22em] uppercase">
                                § {String(comment.comment_type ?? '').replaceAll('_', ' ')}
                            </div>
                            <div className="font-display text-foreground mt-1 text-base font-light tracking-tight">
                                {comment.author?.name ?? 'System'}
                            </div>
                            <div className="text-foreground/80 mt-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                                {comment.body}
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 ? (
                        <div className="text-muted-foreground text-[13px]">No comments yet.</div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
