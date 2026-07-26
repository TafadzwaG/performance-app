<?php

namespace App\Support\Performance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SetupCodeGenerator
{
    public static function fromName(Model $model, string $name, string $column = 'code'): string
    {
        $base = Str::upper(Str::slug($name, '_')) ?: 'ITEM';
        $base = Str::limit($base, 80, '');
        $code = $base;
        $suffix = 1;

        while ($model->newQuery()->where($column, $code)->exists()) {
            $code = Str::limit($base, 75, '').'_'.$suffix;
            $suffix++;
        }

        return $code;
    }
}
