<?php

namespace App\Enums\DisasterRecovery;

enum RestoreRequestStatus: string
{
    case PendingApproval = 'pending_approval';
    case Approved = 'approved';
    case Running = 'running';
    case Completed = 'completed';
    case Failed = 'failed';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
}
