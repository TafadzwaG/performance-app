<?php

namespace App\Support\Tenancy;

use App\Tenancy\TenantContext;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\Unique;

class TenantRule
{
    public static function unique(string $table, string $column, mixed $ignore = null): Unique
    {
        $rule = Rule::unique($table, $column)
            ->where(fn ($query) => $query->where('organization_id', app(TenantContext::class)->requireId()));

        return $ignore !== null ? $rule->ignore($ignore) : $rule;
    }

    public static function exists(string $table, string $column = 'id'): Exists
    {
        return Rule::exists($table, $column)
            ->where(fn ($query) => $query->where('organization_id', app(TenantContext::class)->requireId()));
    }

    public static function activeMember(string $column = 'user_id'): Exists
    {
        return Rule::exists('organization_memberships', $column)
            ->where(fn ($query) => $query
                ->where('organization_id', app(TenantContext::class)->requireId())
                ->where('status', 'active'));
    }

    public static function visibleLocation(): Exists
    {
        $context = app(TenantContext::class);
        $rule = Rule::exists('locations', 'id')
            ->where(fn ($query) => $query
                ->where('organization_id', $context->requireId())
                ->where('is_active', true));
        $user = auth()->user();
        $allowedIds = $user ? $context->allowedLocationIds($user) : null;

        return $allowedIds === null
            ? $rule
            : $rule->where(fn ($query) => $query->whereIn('id', $allowedIds));
    }
}
