<?php

namespace App\Enums;

enum WorkflowStage: string
{
    case GoalSetting = 'goal_setting';
    case SelfAssessment = 'self_assessment';
    case ManagerReview = 'manager_review';
    case Approval = 'approval';
    case Finalization = 'finalization';
}
