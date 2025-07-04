<?php

namespace App\Services;

use App\Classes\Hook;
use App\Classes\Schema;
use App\Events\AfterHardResetEvent;
use App\Events\BeforeHardResetEvent;
use App\Models\Customer;
use App\Models\Option;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class ResetService
{
    public function softReset()
    {
        $tables = Hook::filter( 'ns-wipeable-tables', [
            'jgrem_coupons',
            'jgrem_coupons_products',
            'jgrem_coupons_categories',
            'jgrem_coupons_customers',
            'jgrem_coupons_customers_groups',

            'jgrem_customers_account_history',
            'jgrem_customers_addresses',
            'jgrem_customers_coupons',
            'jgrem_customers_groups',
            'jgrem_customers_rewards',

            'jgrem_dashboard_days',
            'jgrem_dashboard_weeks',
            'jgrem_dashboard_months',

            'jgrem_transactions',
            'jgrem_transactions_accounts',
            'jgrem_transactions_histories',
            'jgrem_transactions_balance_days',
            'jgrem_transactions_balance_months',
            'jgrem_transactions_actions_rules',

            'jgrem_medias',
            'jgrem_notifications',

            'jgrem_orders',
            'jgrem_orders_addresses',
            'jgrem_orders_count',
            'jgrem_orders_coupons',
            'jgrem_orders_metas',
            'jgrem_orders_payments',
            'jgrem_orders_products',
            'jgrem_orders_products_refunds',
            'jgrem_orders_refunds',
            'jgrem_orders_storage',
            'jgrem_orders_taxes',

            'jgrem_procurements',
            'jgrem_procurements_products',

            'jgrem_products',
            'jgrem_products_categories',
            'jgrem_products_histories',
            'jgrem_products_histories_combined',
            'jgrem_products_galleries',
            'jgrem_products_metas',
            'jgrem_products_taxes',
            'jgrem_products_unit_quantities',

            'jgrem_payments_types',

            'jgrem_providers',

            'jgrem_registers',
            'jgrem_registers_history',

            'jgrem_rewards_system',
            'jgrem_rewards_system_rules',

            'jgrem_taxes',
            'jgrem_taxes_groups',

            'jgrem_units',
            'jgrem_units_groups',
        ] );

        foreach ( $tables as $table ) {
            if ( Hook::filter( 'ns-reset-table', $table ) !== false && Schema::hasTable( Hook::filter( 'ns-reset-table', $table ) ) ) {
                DB::table( Hook::filter( 'ns-table-name', $table ) )->truncate();
            }
        }

        /**
         * @var CustomerService $customerService
         */
        $customerService = app()->make( CustomerService::class );

        /**
         * Customers stills needs to be cleared
         * so we'll remove them manually.
         */
        Customer::get()->each( fn( $customer ) => $customerService->delete( $customer ) );

        /**
         * We'll delete all options where key starts with "ns_"
         * as this is a reserved key for the system, we can safely delete it
         * but excluding some options provided in an array
         */
        Option::where( 'key', 'LIKE', 'ns\_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_pa_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_gastro_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_sms_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_email_%' )
            ->where( 'key', 'NOT LIKE', 'ns-stocktransfers%' )
            ->whereNotIn( 'key', [
                'ns_store_name',
                'ns_store_email',
                'ns_date_format',
                'ns_datetime_format',
                'ns_currency_precision',
                'ns_currency_iso',
                'ns_currency_symbol',
                'enabled_modules',
                'ns_jgrem_order_types',
            ] )->delete();

        return [
            'status' => 'success',
            'message' => __( 'The table has been truncated.' ),
        ];
    }

    /**
     * Will completely wipe the database
     * forcing a new installation to be made
     */
    public function hardReset(): array
    {
        BeforeHardResetEvent::dispatch();

        /**
         * this will only apply clearing all tables
         * when we're not using sqlite.
         */
        if ( env( 'DB_CONNECTION' ) !== 'sqlite' ) {
            $tables = DB::select( 'SHOW TABLES' );

            foreach ( $tables as $table ) {
                $table_name = array_values( (array) $table )[0];
                DB::statement( 'SET FOREIGN_KEY_CHECKS = 0' );
                DB::statement( "DROP TABLE `$table_name`" );
                DB::statement( 'SET FOREIGN_KEY_CHECKS = 1' );
            }
        } else {
            file_put_contents( database_path( 'database.sqlite' ), '' );
        }

        Artisan::call( 'key:generate', [ '--force' => true ] );
        Artisan::call( 'ns:cookie generate' );

        exec( 'rm -rf public/storage' );

        AfterHardResetEvent::dispatch();

        return [
            'status' => 'success',
            'message' => __( 'The database has been wiped out.' ),
        ];
    }

    public function handleCustom( $data )
    {
        /**
         * @var string $mode
         * @var bool   $create_sales
         * @var bool   $create_procurements
         */
        extract( $data );

        return Hook::filter( 'ns-handle-custom-reset', [
            'status' => 'error',
            'message' => __( 'No custom handler for the reset "' . $mode . '"' ),
        ], $data );
    }
}
