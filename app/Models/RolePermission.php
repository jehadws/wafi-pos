<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $role_id
 */
class RolePermission extends NsRootModel
{
    use HasFactory;

    protected $table = 'jgrem_role_permission';

    public $timestamps = false;

    public $incrementing = false;
}
