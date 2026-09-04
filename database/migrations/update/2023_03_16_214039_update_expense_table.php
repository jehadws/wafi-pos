<?php

use App\Classes\Schema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if ( Schema::hasTable( 'subul_expenses' ) ) {
            Schema::table( 'subul_expenses', function ( Blueprint $table ) {
                if ( Schema::hasColumn( 'subul_expenses', 'occurence' ) ) {
                    $table->renameColumn( 'occurence', 'occurrence' );
                }
                if ( Schema::hasColumn( 'subul_expenses', 'occurence_value' ) ) {
                    $table->renameColumn( 'occurence_value', 'occurrence_value' );
                }
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
        //
    }
};
