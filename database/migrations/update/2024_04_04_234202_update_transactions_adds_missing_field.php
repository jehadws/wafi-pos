<?php

use App\Classes\Schema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if ( Schema::hasTable( 'jgrem_transactions' ) ) {
            Schema::table( 'jgrem_transactions', function ( Blueprint $table ) {
                if ( ! Schema::hasColumn( 'jgrem_transactions', 'scheduled_date' ) ) {
                    $table->datetime( 'scheduled_date' )->nullable();
                }
                if ( ! Schema::hasColumn( 'jgrem_transactions', 'account_id' ) ) {
                    $table->integer( 'account_id' )->nullable();
                }
            } );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
