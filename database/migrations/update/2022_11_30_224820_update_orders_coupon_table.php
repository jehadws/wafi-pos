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
        Schema::table( 'subul_orders_coupons', function ( Blueprint $table ) {
            if ( ! Schema::hasColumn( 'subul_orders_coupons', 'coupon_id' ) ) {
                $table->integer( 'coupon_id' )->nullable();
            }
        } );
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table( 'subul_orders_coupons', function ( Blueprint $table ) {
            if ( Schema::hasColumn( 'subul_orders_coupons', 'coupon_id' ) ) {
                $table->dropColumn( 'coupon_id' );
            }
        } );
    }
};
