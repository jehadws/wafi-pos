<?php

namespace App\Models;

/**
 * @property int            $id
 * @property string         $uuid
 * @property int            $author
 * @property bool           $featured
 * @property \Carbon\Carbon $updated_at
 */
class ProductGallery extends SbModel
{
    protected $table = 'subul_products_galleries';

    protected $fillable = [
        'name',
        'product_id',
        'media_id',
        'url',
        'order',
        'featured',
        'author',
    ];

    public $casts = [
        'featured' => 'boolean',
        'product_id' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo( Product::class );
    }
}
