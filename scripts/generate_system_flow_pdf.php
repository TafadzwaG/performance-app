<?php

declare(strict_types=1);

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$generatedAt = Carbon::now()->format('Y-m-d H:i');

$html = <<<HTML
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Employee Performance System Flow</title>
    <style>
        @page { margin: 24px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #222222;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
        }
        .header {
            border-bottom: 2px solid #385144;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        h1 {
            color: #385144;
            font-size: 20px;
            margin: 0 0 2px 0;
        }
        .subtitle {
            color: #385144;
            font-size: 12px;
            margin: 0;
        }
        h2 {
            color: #385144;
            font-size: 14px;
            margin: 14px 0 8px;
            border-left: 4px solid #C2D8C4;
            padding-left: 8px;
        }
        .box-row {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        .box-row td {
            border: 1px solid #C2D8C4;
            padding: 7px;
            text-align: center;
            vertical-align: middle;
            background: #F8F5F2;
            font-weight: 600;
        }
        .arrow-row td {
            border: none;
            text-align: center;
            color: #385144;
            font-size: 14px;
            padding: 2px 0 6px;
            font-weight: 700;
        }
        .grid {
            width: 100%;
            border-collapse: collapse;
        }
        .grid th, .grid td {
            border: 1px solid #C2D8C4;
            padding: 7px;
            text-align: left;
            vertical-align: top;
        }
        .grid th {
            background: #385144;
            color: #F8F5F2;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: .3px;
        }
        .small {
            font-size: 10px;
            color: #555;
        }
        ul {
            margin: 4px 0 0 18px;
            padding: 0;
        }
        li { margin-bottom: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Employee Performance Appraisal System</h1>
        <p class="subtitle">End-to-End Workflow Diagram and Stage Mapping</p>
        <p class="small">Generated: {$generatedAt}</p>
    </div>

    <h2>1) Main Workflow Diagram</h2>

    <table class="box-row">
        <tr>
            <td>Login</td>
            <td>Profile Check</td>
            <td>Dashboard</td>
        </tr>
    </table>
    <table class="arrow-row"><tr><td>↓</td></tr></table>
    <table class="box-row">
        <tr>
            <td>Setup Masters<br><span class="small">Departments, Job Titles, Perspectives, Competencies, Rating Scales, Templates, Goal Library</span></td>
        </tr>
    </table>
    <table class="arrow-row"><tr><td>↓</td></tr></table>
    <table class="box-row">
        <tr>
            <td>Review Cycle Creation & Assignment<br><span class="small">Open cycle, assign employees, attach template</span></td>
        </tr>
    </table>
    <table class="arrow-row"><tr><td>↓</td></tr></table>
    <table class="box-row">
        <tr>
            <td>Goal Planning<br><span class="small">SMART objectives, KPI, target, evidence source, due date, weights = 100%</span></td>
            <td>Self Assessment<br><span class="small">Achievements, self-rating, comments, evidence</span></td>
            <td>Manager Review<br><span class="small">Manager ratings, competency ratings, comments, send-back or forward</span></td>
        </tr>
    </table>
    <table class="arrow-row"><tr><td>↓</td></tr></table>
    <table class="box-row">
        <tr>
            <td>Approving Manager Decision<br><span class="small">Approve or send-back</span></td>
            <td>HR/Admin Finalization<br><span class="small">Lock record and publish final output</span></td>
        </tr>
    </table>
    <table class="arrow-row"><tr><td>↓</td></tr></table>
    <table class="box-row">
        <tr>
            <td>Development Plan</td>
            <td>Reports + Excel Exports + PDF Summary</td>
        </tr>
    </table>

    <h2>2) Workflow Stages and Actors</h2>
    <table class="grid">
        <thead>
            <tr>
                <th>Stage</th>
                <th>Main Actor</th>
                <th>Output</th>
                <th>Possible Return Path</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Goal Setting</td>
                <td>Employee / Manager</td>
                <td>Objectives finalized; weight validation at 100%</td>
                <td>Manager can request correction</td>
            </tr>
            <tr>
                <td>Self Assessment</td>
                <td>Employee</td>
                <td>Self ratings, achievements, issues, evidence</td>
                <td>Manager can send back</td>
            </tr>
            <tr>
                <td>Manager Review</td>
                <td>Line Manager</td>
                <td>Manager ratings and competency scoring</td>
                <td>Approver can send back</td>
            </tr>
            <tr>
                <td>Approval</td>
                <td>Approving Manager</td>
                <td>Approval decision + final comments</td>
                <td>Send back to manager/employee</td>
            </tr>
            <tr>
                <td>Finalization</td>
                <td>HR/Admin</td>
                <td>Final score + rating label locked</td>
                <td>None (record finalized)</td>
            </tr>
        </tbody>
    </table>

    <h2>3) Scoring Summary</h2>
    <ul>
        <li>Business Score: weighted objective ratings from manager review.</li>
        <li>Values Score: averaged competency/values ratings from manager review.</li>
        <li>Overall Score: (Business × business_weight + Values × values_weight) / 100.</li>
        <li>Final Rating: mapped from overall score using configured rating scale levels.</li>
    </ul>

    <h2>4) Access Control Model</h2>
    <ul>
        <li>Role and permission checks are permission-driven via Spatie (DB-managed roles).</li>
        <li>No runtime hardcoded role-name branching for access decisions.</li>
        <li>Policies enforce ownership context (employee, line manager, approving manager).</li>
    </ul>
</body>
</html>
HTML;

$outputDirectory = public_path('docs');
File::ensureDirectoryExists($outputDirectory);

$outputFile = $outputDirectory . DIRECTORY_SEPARATOR . 'employee-performance-system-flow.pdf';

Pdf::loadHTML($html)
    ->setPaper('a4', 'portrait')
    ->save($outputFile);

echo $outputFile . PHP_EOL;
