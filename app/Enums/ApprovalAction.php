<?php

namespace App\Enums;

enum ApprovalAction: string
{
    case Submitted = 'submitted';
    case Forwarded = 'forwarded';
    case SentBack = 'sent_back';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Finalized = 'finalized';
}
