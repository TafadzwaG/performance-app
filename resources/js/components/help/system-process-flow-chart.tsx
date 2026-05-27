import { Badge } from '@/components/ui/badge';

const statusPath = [
    'draft',
    'goal_setting',
    'self_assessment_pending',
    'manager_review_pending',
    'approval_pending',
    'approved',
    'finalized',
    'sent_back',
];

const workflowRules = [
    {
        title: 'Assignment rule',
        description: 'An employee cannot be assigned to a review cycle unless an approving manager is present on the employee profile.',
    },
    {
        title: 'Goal-setting rule',
        description: 'Business objectives that count toward the score must total exactly 100 before the goal plan can be submitted.',
    },
    {
        title: 'Approval rule',
        description: 'Final approval calculates and stores business score, values score, overall score, and the mapped rating level.',
    },
];

export default function SystemProcessFlowChart() {
    return (
        <div className="space-y-6">
            <div className="overflow-x-auto rounded-xl border bg-background">
                <svg
                    viewBox="0 0 1320 620"
                    className="min-w-[960px] w-full"
                    role="img"
                    aria-label="Employee performance appraisal system process flow"
                >
                    <defs>
                        <marker id="flow-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L10,5 L0,10 z" fill="#4b5563" />
                        </marker>
                        <marker id="flow-arrow-dashed" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L10,5 L0,10 z" fill="#6b7280" />
                        </marker>
                    </defs>

                    <rect x="0" y="0" width="1320" height="620" fill="#ffffff" />

                    <text x="24" y="28" fontSize="13" fontWeight="700" fill="#4b5563">
                        Foundation
                    </text>
                    <text x="420" y="28" fontSize="13" fontWeight="700" fill="#4b5563">
                        Appraisal Workflow
                    </text>
                    <text x="1050" y="28" fontSize="13" fontWeight="700" fill="#4b5563">
                        Outputs
                    </text>

                    <rect x="24" y="60" width="240" height="88" rx="12" fill="#f9fafb" stroke="#111827" strokeWidth="1.4" />
                    <text x="44" y="88" fontSize="16" fontWeight="700" fill="#111827">
                        Setup Masters
                    </text>
                    <text x="44" y="112" fontSize="12" fill="#374151">
                        Departments, Job Titles,
                    </text>
                    <text x="44" y="130" fontSize="12" fill="#374151">
                        Perspectives, Competencies,
                    </text>
                    <text x="44" y="148" fontSize="12" fill="#374151">
                        Rating Scales, Templates, Goals
                    </text>

                    <rect x="24" y="184" width="240" height="88" rx="12" fill="#f9fafb" stroke="#111827" strokeWidth="1.4" />
                    <text x="44" y="212" fontSize="16" fontWeight="700" fill="#111827">
                        Access Control
                    </text>
                    <text x="44" y="236" fontSize="12" fill="#374151">
                        Users, Roles, Permissions
                    </text>
                    <text x="44" y="254" fontSize="12" fill="#374151">
                        Spatie permission model
                    </text>

                    <rect x="24" y="308" width="240" height="110" rx="12" fill="#f9fafb" stroke="#111827" strokeWidth="1.4" />
                    <text x="44" y="336" fontSize="16" fontWeight="700" fill="#111827">
                        Employee Profiles
                    </text>
                    <text x="44" y="360" fontSize="12" fill="#374151">
                        User link, employee number,
                    </text>
                    <text x="44" y="378" fontSize="12" fill="#374151">
                        department, job title, line manager,
                    </text>
                    <text x="44" y="396" fontSize="12" fill="#374151">
                        approving manager, HR profile data
                    </text>

                    <rect x="332" y="184" width="230" height="88" rx="12" fill="#f3f4f6" stroke="#111827" strokeWidth="1.4" />
                    <text x="352" y="212" fontSize="16" fontWeight="700" fill="#111827">
                        Review Cycles
                    </text>
                    <text x="352" y="236" fontSize="12" fill="#374151">
                        Create, open, close cycles
                    </text>
                    <text x="352" y="254" fontSize="12" fill="#374151">
                        with goal and review deadlines
                    </text>

                    <rect x="332" y="308" width="230" height="110" rx="12" fill="#f3f4f6" stroke="#111827" strokeWidth="1.4" />
                    <text x="352" y="336" fontSize="16" fontWeight="700" fill="#111827">
                        Cycle Assignment
                    </text>
                    <text x="352" y="360" fontSize="12" fill="#374151">
                        Assign template + employee
                    </text>
                    <text x="352" y="378" fontSize="12" fill="#374151">
                        Create one appraisal per
                    </text>
                    <text x="352" y="396" fontSize="12" fill="#374151">
                        employee per review cycle
                    </text>

                    <rect x="640" y="60" width="240" height="88" rx="12" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
                    <text x="660" y="88" fontSize="16" fontWeight="700" fill="#111827">
                        1. Goal Planning
                    </text>
                    <text x="660" y="112" fontSize="12" fill="#374151">
                        SMART objectives and weights
                    </text>
                    <text x="660" y="130" fontSize="12" fill="#374151">
                        must total 100 for business goals
                    </text>

                    <rect x="640" y="176" width="240" height="88" rx="12" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
                    <text x="660" y="204" fontSize="16" fontWeight="700" fill="#111827">
                        2. Self Assessment
                    </text>
                    <text x="660" y="228" fontSize="12" fill="#374151">
                        Performance achieved, self ratings,
                    </text>
                    <text x="660" y="246" fontSize="12" fill="#374151">
                        comments, evidence
                    </text>

                    <rect x="640" y="292" width="240" height="88" rx="12" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
                    <text x="660" y="320" fontSize="16" fontWeight="700" fill="#111827">
                        3. Manager Review
                    </text>
                    <text x="660" y="344" fontSize="12" fill="#374151">
                        Manager ratings, competency ratings,
                    </text>
                    <text x="660" y="362" fontSize="12" fill="#374151">
                        comments, forward or send back
                    </text>

                    <rect x="640" y="408" width="240" height="88" rx="12" fill="#ffffff" stroke="#111827" strokeWidth="1.5" />
                    <text x="660" y="436" fontSize="16" fontWeight="700" fill="#111827">
                        4. Final Approval
                    </text>
                    <text x="660" y="460" fontSize="12" fill="#374151">
                        Approving manager approves
                    </text>
                    <text x="660" y="478" fontSize="12" fill="#374151">
                        or sends back for correction
                    </text>

                    <rect x="958" y="176" width="230" height="88" rx="12" fill="#f9fafb" stroke="#111827" strokeWidth="1.5" />
                    <text x="978" y="204" fontSize="16" fontWeight="700" fill="#111827">
                        5. Finalization
                    </text>
                    <text x="978" y="228" fontSize="12" fill="#374151">
                        HR finalizes approved appraisals
                    </text>
                    <text x="978" y="246" fontSize="12" fill="#374151">
                        and locks final result
                    </text>

                    <rect x="958" y="328" width="230" height="108" rx="12" fill="#f9fafb" stroke="#111827" strokeWidth="1.5" />
                    <text x="978" y="356" fontSize="16" fontWeight="700" fill="#111827">
                        Reports and Documents
                    </text>
                    <text x="978" y="380" fontSize="12" fill="#374151">
                        Dashboard, cycle summary, department
                    </text>
                    <text x="978" y="398" fontSize="12" fill="#374151">
                        summary, employee summary,
                    </text>
                    <text x="978" y="416" fontSize="12" fill="#374151">
                        Excel export, print view, final PDF
                    </text>

                    <rect x="958" y="488" width="230" height="88" rx="12" fill="#f9fafb" stroke="#111827" strokeWidth="1.5" />
                    <text x="978" y="516" fontSize="16" fontWeight="700" fill="#111827">
                        Audit and Notifications
                    </text>
                    <text x="978" y="540" fontSize="12" fill="#374151">
                        Status history, approvals,
                    </text>
                    <text x="978" y="558" fontSize="12" fill="#374151">
                        comments, workflow notifications
                    </text>

                    <line x1="264" y1="104" x2="332" y2="216" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="264" y1="228" x2="332" y2="228" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="264" y1="362" x2="332" y2="362" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="447" y1="272" x2="447" y2="308" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="562" y1="362" x2="640" y2="104" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />

                    <line x1="760" y1="148" x2="760" y2="176" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="760" y1="264" x2="760" y2="292" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="760" y1="380" x2="760" y2="408" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="880" y1="452" x2="958" y2="220" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="1073" y1="264" x2="1073" y2="328" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />
                    <line x1="1073" y1="436" x2="1073" y2="488" stroke="#4b5563" strokeWidth="2" markerEnd="url(#flow-arrow)" />

                    <path
                        d="M640,336 C570,336 570,220 640,220"
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="2"
                        strokeDasharray="8 6"
                        markerEnd="url(#flow-arrow-dashed)"
                    />
                    <text x="520" y="274" fontSize="11" fill="#6b7280">
                        send back
                    </text>

                    <path
                        d="M640,452 C560,452 540,336 640,336"
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="2"
                        strokeDasharray="8 6"
                        markerEnd="url(#flow-arrow-dashed)"
                    />
                    <text x="512" y="406" fontSize="11" fill="#6b7280">
                        send back
                    </text>

                    <rect x="448" y="500" width="400" height="76" rx="12" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.2" />
                    <text x="468" y="526" fontSize="14" fontWeight="700" fill="#111827">
                        Scoring Model
                    </text>
                    <text x="468" y="548" fontSize="12" fill="#374151">
                        Business score = weighted manager objective ratings
                    </text>
                    <text x="468" y="566" fontSize="12" fill="#374151">
                        Values score = average manager competency ratings | Overall = template split (default 80/20)
                    </text>
                </svg>
            </div>

            <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status path</p>
                <div className="flex flex-wrap gap-2">
                    {statusPath.map((status) => (
                        <Badge key={status} variant="outline" className="font-mono text-[11px]">
                            {status}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {workflowRules.map((rule) => (
                    <div key={rule.title} className="rounded-xl border bg-muted/10 p-4">
                        <h4 className="text-sm font-semibold text-foreground">{rule.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{rule.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
