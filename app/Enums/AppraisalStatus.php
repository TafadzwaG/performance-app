<?php

namespace App\Enums;

enum AppraisalStatus: string
{
    case Draft = 'draft';
    case GoalSetting = 'goal_setting';
    case SelfAssessmentPending = 'self_assessment_pending';
    case SelfAssessmentSubmitted = 'self_assessment_submitted';
    case ManagerReviewPending = 'manager_review_pending';
    case ManagerReviewCompleted = 'manager_review_completed';
    case ApprovalPending = 'approval_pending';
    case Approved = 'approved';
    case CalibrationPending = 'calibration_pending';
    case SentBack = 'sent_back';
    case Finalized = 'finalized';
}
