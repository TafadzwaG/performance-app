<?php

namespace App\Enums;

enum IssueType: string
{
    case Bug = 'bug';
    case AccessLogin = 'access_login';
    case DataProblem = 'data_problem';
    case Performance = 'performance';
    case FeatureRequest = 'feature_request';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Bug => 'Bug',
            self::AccessLogin => 'Access/Login',
            self::DataProblem => 'Data Problem',
            self::Performance => 'Performance',
            self::FeatureRequest => 'Feature Request',
            self::Other => 'Other',
        };
    }
}
