<?php

namespace App\Classes;

class CrudTable
{
    public static function columns( ...$args )
    {
        return collect( $args )->mapWithKeys( function ( $column ) {
            return [
                $column[ 'identifier' ] => $column,
            ];
        } )->toArray();
    }

    public static function column( $label, $identifier, $sort = true, $attributes = [], $width = 'auto', $minWidth = 'auto', $maxWidth = 'auto', $direction = '' )
    {
        /**
         * The "$" prefix is part of the table contract (CrudColumnDef):
         * "$sort" must be boolean-coercible and "$direction" carries the
         * default sorting direction. The sorting guard on getEntries
         * (CrudService) reads the "$sort" key as well.
         */
        return [
            'identifier'  =>  $identifier,
            'label'       =>  $label,
            '$sort'       =>  (bool) $sort,
            'attributes'  =>  $attributes,
            'width'       =>  $width,
            '$direction'  =>  $direction,
            'maxWidth'    =>  $maxWidth,
            'minWidth'    =>  $minWidth,
        ];
    }

    public static function attribute( $label, $column )
    {
        return compact( 'label', 'column' );
    }

    public static function attributes( ...$attributes )
    {
        return $attributes;
    }

    public static function labels( $list_title, $list_description, $no_entry, $create_new, $create_title, $create_description, $edit_title, $edit_description, $back_to_list )
    {
        return compact( 'list_title', 'list_description', 'no_entry', 'create_new', 'create_title', 'create_description', 'edit_title', 'edit_description', 'back_to_list' );
    }

    public static function links( $list, $create, $edit, $post, $put )
    {
        return compact( 'list', 'create', 'edit', 'post', 'put' );
    }
}
