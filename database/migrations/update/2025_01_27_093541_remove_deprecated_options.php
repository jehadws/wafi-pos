<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //  products_flat_vat
        // products_variable_vat
        if ( sb()->option->get( 'sb_subul_vat' ) === 'products_flat_vat' ) {
            sb()->option->set( 'sb_subul_vat', 'flat_vat' );
            sb()->option->set( 'sb_subul_price_with_tax', 'yes' );
        }

        if ( sb()->option->get( 'sb_subul_vat' ) === 'products_variable_vat' ) {
            sb()->option->set( 'sb_subul_vat', 'variable_vat' );
            sb()->option->set( 'sb_subul_price_with_tax', 'yes' );
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
