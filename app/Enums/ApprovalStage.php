<?php

namespace App\Enums;

enum ApprovalStage: string
{
    case GoalSetting = 'goal_setting';
    case SelfAssessment = 'self_assessment';
    case ManagerReview = 'manager_review';
    case Approval = 'approval';
    case Calibration = 'calibration';
    case Finalization = 'finalization';
}
