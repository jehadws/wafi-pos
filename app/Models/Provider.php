<?php

namespace App\Models;

use App\Classes\Model;
use App\Traits\SbDependable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * @property int            $id
 * @property string         $uuid
 * @property int            $author
 * @property string         $description
 * @property float          $amount_paid
 * @property \Carbon\Carbon $updated_at
 */
class Provider extends SbModel
{
  use HasFactory, SbDependable;

  protected $table = 'subul_' . 'providers';

  protected $guarded = [];

  public function setDependencies()
  {
    return [
      Procurement::class => Model::dependant(
        local_name: 'name',
        local_index: 'id',
        foreign_name: 'code',
        foreign_index: 'provider_id',
      ),
    ];
  }

  public function procurements()
  {
    return $this->hasMany(Procurement::class);
  }

  public function getNameAttribute()
  {
    return "{$this->first_name} {$this->last_name}";
  }
}
