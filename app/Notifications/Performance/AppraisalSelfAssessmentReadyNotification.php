<?php

namespace App\Notifications\Performance;

use App\Models\Appraisal;
use Illuminate\Notifications\Messages\MailMessage;

class AppraisalSelfAssessmentReadyNotification extends AbstractAppraisalNotification
{
    public function __construct(Appraisal $appraisal)
    {
        parent::__construct(
            $appraisal,
            'Self assessment ready',
            "Your goals for {$appraisal->cycle_name_snapshot} were loaded from My KPIs. You can start your self assessment now.",
        );
    }

    public function toMail(object $notifiable): MailMessage
    {
        return parent::toMail($notifiable)
            ->line('Goal setting has already been completed for this cycle.')
            ->line('Open the appraisal and continue directly with your self assessment.');
    }
}
