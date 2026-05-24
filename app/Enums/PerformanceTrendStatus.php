<?php

namespace App\Enums;

enum PerformanceTrendStatus: string
{
    case Improving = 'improving';
    case Declining = 'declining';
    case Stable = 'stable';
    case InsufficientData = 'insufficient_data';

    public function label(): string
    {
        return match ($this) {
            self::Improving => 'Improving',
            self::Declining => 'Declining',
            self::Stable => 'Stable',
            self::InsufficientData => 'Insufficient Data',
        };
    }
}
