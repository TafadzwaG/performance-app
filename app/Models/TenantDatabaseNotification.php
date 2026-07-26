<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Notifications\DatabaseNotification;

class TenantDatabaseNotification extends DatabaseNotification
{
    use BelongsToOrganization;
}
