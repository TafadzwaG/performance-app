<?php

namespace App\Events\Performance;

use App\Models\Appraisal;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppraisalStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Appraisal $appraisal,
        public ?User $actor,
        public string $event,
        public array $context = [],
    ) {
    }
}
