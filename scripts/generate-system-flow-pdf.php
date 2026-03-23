<?php

declare(strict_types=1);

use Dompdf\Dompdf;
use Dompdf\Options;

require dirname(__DIR__).'/vendor/autoload.php';

$source = dirname(__DIR__).'/docs/SYSTEM_FLOW_DIAGRAM.html';
$target = dirname(__DIR__).'/docs/SYSTEM_FLOW_DIAGRAM.pdf';

if (!is_file($source)) {
    fwrite(STDERR, "Source HTML not found: {$source}\n");
    exit(1);
}

$options = new Options();
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', false);

$dompdf = new Dompdf($options);
$dompdf->setPaper('A4', 'landscape');
$dompdf->loadHtml((string) file_get_contents($source), 'UTF-8');
$dompdf->render();

file_put_contents($target, $dompdf->output());

fwrite(STDOUT, "Generated {$target}\n");
