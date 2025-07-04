<?php

use App\Models\Permission;

if ( defined( 'JG_CREATE_PERMISSIONS' ) ) {
    $medias = Permission::firstOrNew( [ 'namespace' => 'jgrem.upload.medias' ] );
    $medias->name = __( 'Upload Medias' );
    $medias->namespace = 'jgrem.upload.medias';
    $medias->description = __( 'Let the user upload medias.' );
    $medias->save();

    $medias = Permission::firstOrNew( [ 'namespace' => 'jgrem.see.medias' ] );
    $medias->name = __( 'See Medias' );
    $medias->namespace = 'jgrem.see.medias';
    $medias->description = __( 'Let the user see medias.' );
    $medias->save();

    $medias = Permission::firstOrNew( [ 'namespace' => 'jgrem.delete.medias' ] );
    $medias->name = __( 'Delete Medias' );
    $medias->namespace = 'jgrem.delete.medias';
    $medias->description = __( 'Let the user delete medias.' );
    $medias->save();

    $medias = Permission::firstOrNew( [ 'namespace' => 'jgrem.update.medias' ] );
    $medias->name = __( 'Update Medias' );
    $medias->namespace = 'jgrem.update.medias';
    $medias->description = __( 'Let the user update uploaded medias.' );
    $medias->save();
}
