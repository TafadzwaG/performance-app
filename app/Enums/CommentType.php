<?php

namespace App\Enums;

enum CommentType: string
{
    case General = 'general';
    case AchievementNote = 'achievement_note';
    case SignificantIssue = 'significant_issue';
    case SendBack = 'send_back';
}
