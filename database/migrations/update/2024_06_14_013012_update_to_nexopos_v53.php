<?php

use App\Classes\Schema;
use App\Models\OrderPayment;
use App\Models\PaymentType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table( 'jgrem_transactions_accounts', function ( Blueprint $table ) {
            if ( Schema::hasColumn( 'jgrem_transactions_accounts', 'operation' ) ) {
                $table->dropColumn( 'operation' );
            }

            if ( ! Schema::hasColumn( 'jgrem_transactions_accounts', 'sub_category_id' ) ) {
                $table->integer( 'sub_category_id' )->nullable();
            }
        } );

        Schema::table( 'jgrem_transactions_histories', function ( Blueprint $table ) {
            if ( ! Schema::hasColumn( 'jgrem_transactions_histories', 'is_reflection' ) ) {
                $table->boolean( 'is_reflection' )->default( false );
            }
            if ( ! Schema::hasColumn( 'jgrem_transactions_histories', 'reflection_source_id' ) ) {
                $table->integer( 'reflection_source_id' )->nullable();
            }
            if ( ! Schema::hasColumn( 'jgrem_transactions_histories', 'rule_id' ) ) {
                $table->integer( 'rule_id' )->nullable();
            }
        } );

        Schema::table( 'jgrem_orders', function ( Blueprint $table ) {
            if ( ! Schema::hasColumn( 'jgrem_orders', 'total_cogs' ) ) {
                $table->float( 'total_cogs', 18, 5 )->nullable();
            }
        } );

        $cashPaymentType = PaymentType::where( 'identifier', OrderPayment::PAYMENT_CASH )->first();
        ns()->option->set( 'ns_jgrem_registers_default_change_payment_type', $cashPaymentType->id );

        if ( ! defined( 'JG_CREATE_PERMISSIONS' ) ) {
            define( 'JG_CREATE_PERMISSIONS', true );
        }

        include dirname( __FILE__ ) . '/../../permissions/transactions-accounts.php';
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ( Schema::hasTable( 'jgrem_transactions_accounts' ) ) {
            Schema::table( 'jgrem_transactions_accounts', function ( Blueprint $table ) {
                if ( ! Schema::hasColumn( 'jgrem_transactions_accounts', 'operation' ) ) {
                    $table->string( 'operation' )->default( 'debit' );
                }

                if ( Schema::hasColumn( 'jgrem_transactions_accounts', 'sub_category_id' ) ) {
                    $table->dropColumn( 'sub_category_id' );
                }
            } );
        }

        Schema::table( 'jgrem_transactions_histories', function ( Blueprint $table ) {
            if ( Schema::hasColumn( 'jgrem_transactions_histories', 'is_reflection' ) ) {
                $table->dropColumn( 'is_reflection' );
            }
            if ( Schema::hasColumn( 'jgrem_transactions_histories', 'reflection_source_id' ) ) {
                $table->dropColumn( 'reflection_source_id' );
            }
            if ( Schema::hasColumn( 'jgrem_transactions_histories', 'rule_id' ) ) {
                $table->dropColumn( 'rule_id' );
            }
        } );

        Schema::table( 'jgrem_orders', function ( Blueprint $table ) {
            if ( Schema::hasColumn( 'jgrem_orders', 'total_cogs' ) ) {
                $table->dropColumn( 'total_cogs' );
            }
        } );
    }
};
