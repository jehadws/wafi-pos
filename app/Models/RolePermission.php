<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int $role_id
 */
class RolePermission extends SbRootModel
{
    use HasFactory;

    protected $table = 'subul_role_permission';

    public $timestamps = false;

    public $incrementing = false;
}
