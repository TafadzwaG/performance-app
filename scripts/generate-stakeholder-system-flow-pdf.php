<?php

declare(strict_types=1);

use Dompdf\Dompdf;
use Dompdf\Options;

require dirname(__DIR__).'/vendor/autoload.php';

$root = dirname(__DIR__);
$logoPath = $root.'/public/logo.svg';
$htmlTarget = $root.'/docs/SYSTEM_FLOW_DIAGRAM_STAKEHOLDER.html';
$pdfTarget = $root.'/docs/SYSTEM_FLOW_DIAGRAM_STAKEHOLDER.pdf';
$appName = readEnvValue($root.'/.env', 'APP_NAME') ?: 'Performance Management System';
$generatedAt = date('Y-m-d H:i');
$logoDataUri = is_file($logoPath)
    ? 'data:image/svg+xml;base64,'.base64_encode((string) file_get_contents($logoPath))
    : null;

$logoMarkup = $logoDataUri
    ? '<img src="'.$logoDataUri.'" alt="'.e($appName).' logo" style="height:48px; width:auto;">'
    : '<div style="font-size:22px; font-weight:700; color:#111827;">'.e($appName).'</div>';

$html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{$appName} Stakeholder Flow</title>
    <style>
        @page { margin: 20px 24px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            margin: 0;
            color: #111827;
            background: #ffffff;
        }
        .header {
            background: #111827;
            color: #ffffff;
            border-radius: 18px;
            padding: 18px 22px;
            overflow: hidden;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: middle;
        }
        .brand-box {
            background: #ffffff;
            border-radius: 14px;
            padding: 12px 14px;
            width: 270px;
            text-align: center;
        }
        .eyebrow {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #9ca3af;
            margin-bottom: 6px;
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            line-height: 1.15;
            margin: 0 0 6px;
        }
        .subtitle {
            font-size: 11px;
            line-height: 1.5;
            color: #d1d5db;
            margin: 0;
        }
        .section {
            margin-top: 16px;
        }
        .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 700;
        }
        .summary-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin-left: -10px;
            margin-right: -10px;
        }
        .summary-card {
            border: 1px solid #d1d5db;
            border-radius: 14px;
            padding: 12px 14px;
            background: #f9fafb;
            height: 84px;
        }
        .summary-card strong {
            display: block;
            margin-bottom: 6px;
            font-size: 12px;
            color: #111827;
        }
        .summary-card span {
            display: block;
            font-size: 10px;
            line-height: 1.45;
            color: #4b5563;
        }
        .legend {
            margin-top: 10px;
        }
        .pill {
            display: inline-block;
            border: 1px solid #d1d5db;
            border-radius: 999px;
            padding: 4px 8px;
            margin-right: 6px;
            margin-bottom: 6px;
            font-size: 9px;
            color: #374151;
            background: #ffffff;
        }
        .footer {
            margin-top: 10px;
            font-size: 9px;
            color: #6b7280;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 300px;">
                    <div class="brand-box">
                        {$logoMarkup}
                    </div>
                </td>
                <td style="padding-left: 20px;">
                    <div class="eyebrow">Stakeholder Overview</div>
                    <div class="title">Employee Performance Appraisal Flow</div>
                    <p class="subtitle">
                        This view summarizes how the system moves from organizational setup and employee assignment
                        into goal planning, assessment, approval, finalization, and reporting. It is designed for leadership,
                        HR, and operational stakeholders who need a fast understanding of the end-to-end process.
                    </p>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Executive Summary</div>
        <table class="summary-table">
            <tr>
                <td>
                    <div class="summary-card">
                        <strong>1. Controlled Setup</strong>
                        <span>Departments, job titles, templates, rating scales, and employee reporting lines are established before a cycle begins.</span>
                    </div>
                </td>
                <td>
                    <div class="summary-card">
                        <strong>2. Managed Workflow</strong>
                        <span>Employees, line managers, and approving managers each complete their stage with audit history and controlled send-back points.</span>
                    </div>
                </td>
                <td>
                    <div class="summary-card">
                        <strong>3. Decision-Ready Output</strong>
                        <span>Approved and finalized appraisals feed score summaries, stakeholder reports, Excel exports, and printable PDF records.</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Stakeholder Flow Diagram</div>
        <svg width="1200" height="560" viewBox="0 0 1200 560" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L10,5 L0,10 z" fill="#374151"></path>
                </marker>
                <marker id="arrowBack" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L10,5 L0,10 z" fill="#9ca3af"></path>
                </marker>
            </defs>

            <rect x="0" y="0" width="1200" height="560" fill="#ffffff"/>

            <rect x="12" y="24" width="1176" height="138" rx="18" fill="#f9fafb" stroke="#d1d5db"/>
            <text x="34" y="48" font-size="12" font-weight="700" fill="#6b7280" letter-spacing="1.6">FOUNDATION</text>

            <rect x="32" y="66" width="210" height="74" rx="12" fill="#ffffff" stroke="#111827" stroke-width="1.2"/>
            <text x="50" y="92" font-size="15" font-weight="700" fill="#111827">Setup Masters</text>
            <text x="50" y="114" font-size="11" fill="#4b5563">Departments, job titles, templates,</text>
            <text x="50" y="131" font-size="11" fill="#4b5563">rating scales, competencies, goals</text>

            <rect x="288" y="66" width="210" height="74" rx="12" fill="#ffffff" stroke="#111827" stroke-width="1.2"/>
            <text x="306" y="92" font-size="15" font-weight="700" fill="#111827">Access and Users</text>
            <text x="306" y="114" font-size="11" fill="#4b5563">Users, employee profiles, roles,</text>
            <text x="306" y="131" font-size="11" fill="#4b5563">permissions, reporting lines</text>

            <rect x="544" y="66" width="210" height="74" rx="12" fill="#ffffff" stroke="#111827" stroke-width="1.2"/>
            <text x="562" y="92" font-size="15" font-weight="700" fill="#111827">Review Cycle</text>
            <text x="562" y="114" font-size="11" fill="#4b5563">Create cycle, define deadlines,</text>
            <text x="562" y="131" font-size="11" fill="#4b5563">open when ready</text>

            <rect x="800" y="66" width="356" height="74" rx="12" fill="#ffffff" stroke="#111827" stroke-width="1.2"/>
            <text x="818" y="92" font-size="15" font-weight="700" fill="#111827">Cycle Assignment and Appraisal Creation</text>
            <text x="818" y="114" font-size="11" fill="#4b5563">Assign employees to the cycle with a template. The system creates one appraisal per employee per cycle.</text>

            <line x1="242" y1="103" x2="288" y2="103" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>
            <line x1="498" y1="103" x2="544" y2="103" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>
            <line x1="754" y1="103" x2="800" y2="103" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>

            <rect x="12" y="184" width="1176" height="232" rx="18" fill="#ffffff" stroke="#d1d5db"/>
            <text x="34" y="208" font-size="12" font-weight="700" fill="#6b7280" letter-spacing="1.6">APPRAISAL WORKFLOW</text>

            <rect x="34" y="244" width="210" height="96" rx="14" fill="#f9fafb" stroke="#111827" stroke-width="1.3"/>
            <text x="54" y="270" font-size="16" font-weight="700" fill="#111827">1. Goal Planning</text>
            <text x="54" y="293" font-size="11" fill="#4b5563">Employee and manager define SMART objectives,</text>
            <text x="54" y="310" font-size="11" fill="#4b5563">KPI measures, targets, evidence, and due dates.</text>
            <text x="54" y="327" font-size="11" fill="#4b5563">Business weights must total exactly 100.</text>

            <rect x="270" y="244" width="210" height="96" rx="14" fill="#f9fafb" stroke="#111827" stroke-width="1.3"/>
            <text x="290" y="270" font-size="16" font-weight="700" fill="#111827">2. Self Assessment</text>
            <text x="290" y="293" font-size="11" fill="#4b5563">Employee captures performance achieved,</text>
            <text x="290" y="310" font-size="11" fill="#4b5563">self ratings, comments, and evidence.</text>
            <text x="290" y="327" font-size="11" fill="#4b5563">Submission moves the appraisal to the manager.</text>

            <rect x="506" y="244" width="210" height="96" rx="14" fill="#f9fafb" stroke="#111827" stroke-width="1.3"/>
            <text x="526" y="270" font-size="16" font-weight="700" fill="#111827">3. Manager Review</text>
            <text x="526" y="293" font-size="11" fill="#4b5563">Line manager rates objectives and competencies,</text>
            <text x="526" y="310" font-size="11" fill="#4b5563">adds comments, and either forwards or sends back.</text>
            <text x="526" y="327" font-size="11" fill="#4b5563">All manager ratings must be present.</text>

            <rect x="742" y="244" width="210" height="96" rx="14" fill="#f9fafb" stroke="#111827" stroke-width="1.3"/>
            <text x="762" y="270" font-size="16" font-weight="700" fill="#111827">4. Final Approval</text>
            <text x="762" y="293" font-size="11" fill="#4b5563">Approving manager confirms the result</text>
            <text x="762" y="310" font-size="11" fill="#4b5563">or sends it back for correction.</text>
            <text x="762" y="327" font-size="11" fill="#4b5563">Approval calculates and stores final scores.</text>

            <rect x="978" y="244" width="176" height="96" rx="14" fill="#f9fafb" stroke="#111827" stroke-width="1.3"/>
            <text x="996" y="270" font-size="16" font-weight="700" fill="#111827">5. Finalization</text>
            <text x="996" y="293" font-size="11" fill="#4b5563">HR finalizes the approved</text>
            <text x="996" y="310" font-size="11" fill="#4b5563">appraisal and locks the record.</text>

            <line x1="244" y1="292" x2="270" y2="292" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>
            <line x1="480" y1="292" x2="506" y2="292" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>
            <line x1="716" y1="292" x2="742" y2="292" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>
            <line x1="952" y1="292" x2="978" y2="292" stroke="#374151" stroke-width="2" marker-end="url(#arrow)"/>

            <path d="M742 351 C640 405, 560 405, 506 351" fill="none" stroke="#9ca3af" stroke-width="2" stroke-dasharray="7 6" marker-end="url(#arrowBack)"/>
            <text x="594" y="394" font-size="10" fill="#6b7280">Manager send-back</text>

            <path d="M978 351 C860 435, 410 435, 270 351" fill="none" stroke="#9ca3af" stroke-width="2" stroke-dasharray="7 6" marker-end="url(#arrowBack)"/>
            <text x="560" y="452" font-size="10" fill="#6b7280">Approver send-back for correction</text>

            <rect x="12" y="436" width="1176" height="108" rx="18" fill="#f9fafb" stroke="#d1d5db"/>
            <text x="34" y="460" font-size="12" font-weight="700" fill="#6b7280" letter-spacing="1.6">CONTROLS AND OUTPUTS</text>

            <rect x="34" y="478" width="352" height="48" rx="10" fill="#ffffff" stroke="#d1d5db"/>
            <text x="50" y="498" font-size="12" font-weight="700" fill="#111827">Governance and Access</text>
            <text x="50" y="515" font-size="10" fill="#4b5563">Policies, permissions, roles, mandatory approving manager, audit history, and notification trail.</text>

            <rect x="424" y="478" width="352" height="48" rx="10" fill="#ffffff" stroke="#d1d5db"/>
            <text x="440" y="498" font-size="12" font-weight="700" fill="#111827">Scoring and Final Result</text>
            <text x="440" y="515" font-size="10" fill="#4b5563">Business score from weighted manager ratings, values score from competencies, overall score from template weighting.</text>

            <rect x="814" y="478" width="352" height="48" rx="10" fill="#ffffff" stroke="#d1d5db"/>
            <text x="830" y="498" font-size="12" font-weight="700" fill="#111827">Reporting and Documentation</text>
            <text x="830" y="515" font-size="10" fill="#4b5563">Dashboard metrics, summary reports, OpenSpout Excel exports, browser print view, and DOMPDF final appraisal packs.</text>
        </svg>
    </div>

    <div class="section">
        <div class="section-title">Status Path</div>
        <div class="legend">
            <span class="pill">draft</span>
            <span class="pill">goal_setting</span>
            <span class="pill">self_assessment_pending</span>
            <span class="pill">manager_review_pending</span>
            <span class="pill">approval_pending</span>
            <span class="pill">approved</span>
            <span class="pill">finalized</span>
            <span class="pill">sent_back</span>
        </div>
    </div>

    <div class="footer">Generated on {$generatedAt} for {$appName}</div>
</body>
</html>
HTML;

file_put_contents($htmlTarget, $html);

$options = new Options();
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', true);

$dompdf = new Dompdf($options);
$dompdf->setPaper('A4', 'landscape');
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->render();
file_put_contents($pdfTarget, $dompdf->output());

fwrite(STDOUT, "Generated {$htmlTarget}\n");
fwrite(STDOUT, "Generated {$pdfTarget}\n");

function readEnvValue(string $path, string $key): ?string
{
    if (!is_file($path)) {
        return null;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#') || !str_starts_with($line, $key.'=')) {
            continue;
        }

        $value = substr($line, strlen($key) + 1);

        return trim($value, " \t\n\r\0\x0B'\"");
    }

    return null;
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
