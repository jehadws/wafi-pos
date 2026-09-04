<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Determine whether the migration
     * should execute when we're accessing
     * a multistore instance.
     */
    public function runOnMultiStore()
    {
        return false;
    }

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if ( ! Schema::hasTable( 'subul_roles' ) ) {
            Schema::create( 'subul_roles', function ( Blueprint $table ) {
                $table->increments( 'id' );
                $table->string( 'name' )->unique();
                $table->string( 'namespace' )->unique();
                $table->text( 'description' )->nullable();
                $table->integer( 'reward_system_id' )->nullable();
                $table->float( 'minimal_credit_payment' )->default( 0 );
                $table->integer( 'author' )->nullable(); // when provided match the user id
                $table->boolean( 'locked' )->default( true ); // means the role can be edited from the frontend.
                $table->timestamps();
            } );
        }

        // Permissions Relation with Roles
        if ( ! Schema::hasTable( 'subul_role_permission' ) ) {
            Schema::create( 'subul_role_permission', function ( Blueprint $table ) {
                $table->integer( 'permission_id' );
                $table->integer( 'role_id' );
                $table->primary( [ 'permission_id', 'role_id' ] );
            } );
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists( 'subul_roles' );
        Schema::dropIfExists( 'subul_role_permission' );
    }
};
