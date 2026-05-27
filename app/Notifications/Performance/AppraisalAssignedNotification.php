<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;
use Illuminate\Notifications\Messages\MailMessage;

class AppraisalAssignedNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Appraisal assigned',
            "A new appraisal for {$appraisal->cycle_name_snapshot} is ready for goal planning.",
        );
    }

    public function toMail(object $notifiable): MailMessage
    {
        return parent::toMail($notifiable)
            ->line('Template: '.($this->appraisal->template_name_snapshot ?? 'Not specified'))
            ->line('Please complete goal planning before the cycle milestone deadline.');
    }
}
