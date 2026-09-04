<?php

namespace App\Classes;

use Illuminate\Support\Facades\Schema as ParentSchema;

class Schema extends ParentSchema
{
    public static function table( $table, $callback )
    {
        return parent::table( Hook::filter( 'sb-table-name', $table ), $callback );
    }

    public static function rename( $previous, $new )
    {
        return parent::rename( Hook::filter( 'sb-table-name', $previous ), Hook::filter( 'sb-table-name', $new ) );
    }

    public static function create( $table, $callback )
    {
        return parent::create( Hook::filter( 'sb-table-name', $table ), $callback );
    }

    public static function createIfMissing( $table, $callback )
    {
        if ( ! parent::hasTable( Hook::filter( 'sb-table-name', $table ) ) ) {
            return parent::create( Hook::filter( 'sb-table-name', $table ), $callback );
        }

        return null;
    }

    public static function hasColumn( $table, $column )
    {
        return parent::hasColumn( Hook::filter( 'sb-table-name', $table ), $column );
    }

    public static function hasTable( $table )
    {
        return parent::hasTable( Hook::filter( 'sb-table-name', $table ) );
    }

    public static function hasColumns( $table, $columns )
    {
        return parent::hasColumns( Hook::filter( 'sb-table-name', $table ), $columns );
    }

    public static function dropIfExists( $table )
    {
        return parent::dropIfExists( Hook::filter( 'sb-table-name', $table ) );
    }

    public static function drop( $table )
    {
        return parent::drop( Hook::filter( 'sb-table-name', $table ) );
    }
}
