<?php

use App\Models\Permission;

if ( defined( 'SB_CREATE_PERMISSIONS' ) ) {
    $medias = Permission::firstOrNew( [ 'namespace' => 'subul.upload.medias' ] );
    $medias->name = __( 'Upload Medias' );
    $medias->namespace = 'subul.upload.medias';
    $medias->description = __( 'Let the user upload medias.' );
    $medias->save();

    $medias = Permission::firstOrNew( [ 'namespace' => 'subul.see.medias' ] );
    $medias->name = __( 'See Medias' );
    $medias->namespace = 'subul.see.medias';
    $medias->description = __( 'Let the user see medias.' );
    $medias->save();

    $medias = Permission::firstOrNew( [ 'namespace' => 'subul.delete.medias' ] );
    $medias->name = __( 'Delete Medias' );
    $medias->namespace = 'subul.delete.medias';
    $medias->description = __( 'Let the user delete medias.' );
    $medias->save();

    $medias = Permission::firstOrNew( [ 'namespace' => 'subul.update.medias' ] );
    $medias->name = __( 'Update Medias' );
    $medias->namespace = 'subul.update.medias';
    $medias->description = __( 'Let the user update uploaded medias.' );
    $medias->save();
}
