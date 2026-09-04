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
        $tables = Hook::filter( 'sb-wipeable-tables', [
            'subul_coupons',
            'subul_coupons_products',
            'subul_coupons_categories',
            'subul_coupons_customers',
            'subul_coupons_customers_groups',

            'subul_customers_account_history',
            'subul_customers_addresses',
            'subul_customers_coupons',
            'subul_customers_groups',
            'subul_customers_rewards',

            'subul_dashboard_days',
            'subul_dashboard_weeks',
            'subul_dashboard_months',

            'subul_transactions',
            'subul_transactions_accounts',
            'subul_transactions_histories',
            'subul_transactions_balance_days',
            'subul_transactions_balance_months',
            'subul_transactions_actions_rules',

            'subul_medias',
            'subul_notifications',

            'subul_orders',
            'subul_orders_addresses',
            'subul_orders_count',
            'subul_orders_coupons',
            'subul_orders_metas',
            'subul_orders_payments',
            'subul_orders_products',
            'subul_orders_products_refunds',
            'subul_orders_refunds',
            'subul_orders_storage',
            'subul_orders_taxes',

            'subul_procurements',
            'subul_procurements_products',

            'subul_products',
            'subul_products_categories',
            'subul_products_histories',
            'subul_products_histories_combined',
            'subul_products_galleries',
            'subul_products_metas',
            'subul_products_taxes',
            'subul_products_unit_quantities',

            'subul_payments_types',

            'subul_providers',

            'subul_registers',
            'subul_registers_history',

            'subul_rewards_system',
            'subul_rewards_system_rules',

            'subul_taxes',
            'subul_taxes_groups',

            'subul_units',
            'subul_units_groups',
        ] );

        foreach ( $tables as $table ) {
            if ( Hook::filter( 'sb-reset-table', $table ) !== false && Schema::hasTable( Hook::filter( 'sb-reset-table', $table ) ) ) {
                DB::table( Hook::filter( 'sb-table-name', $table ) )->truncate();
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
         * We'll delete all options where key starts with "sb_"
         * as this is a reserved key for the system, we can safely delete it
         * but excluding some options provided in an array
         */
        Option::where( 'key', 'LIKE', 'ns\_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_pa_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_gastro_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_sms_%' )
            ->where( 'key', 'NOT LIKE', 'ns\_email_%' )
            ->where( 'key', 'NOT LIKE', 'sb-stocktransfers%' )
            ->whereNotIn( 'key', [
                'sb_store_name',
                'sb_store_email',
                'sb_date_format',
                'sb_datetime_format',
                'sb_currency_precision',
                'sb_currency_iso',
                'sb_currency_symbol',
                'enabled_modules',
                'sb_subul_order_types',
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

        return Hook::filter( 'sb-handle-custom-reset', [
            'status' => 'error',
            'message' => __( 'No custom handler for the reset "' . $mode . '"' ),
        ], $data );
    }
}
