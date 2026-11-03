<?php

namespace App\Services\Helpers;

use App\Classes\Hook;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait App
{
    /**
     * Is installed
     *
     * @return bool
     */
    public static function installed()
    {
        /**
         * The cached verdict lives in the store named by CACHE_STORE, which on
         * a fresh install is "database" — a store whose table is only created
         * by the very migration this check gates. Reading it must therefore
         * never be able to throw, or the setup wizard stays unreachable.
         */
        try {
            if ( ! Cache::has( 'sb-core-installed' ) ) {
                Cache::set( 'sb-core-installed', self::checkDatabaseExistence(), 60 );
            }

            return (bool) Cache::get( 'sb-core-installed' );
        } catch ( \Throwable $e ) {
            return self::checkDatabaseExistence();
        }
    }

    private static function checkDatabaseExistence(): bool
    {
        try {
            if ( DB::connection()->getPdo() ) {
                return Schema::hasTable( 'subul_options' );
            }

            return false;
        } catch ( \Exception $e ) {
            return false;
        }
    }

    public static function pageTitle( $string )
    {
        $storeName = sb()->option->get( 'sb_store_name' ) ?: 'Subul';

        return sprintf(
            Hook::filter( 'sb-page-title', __( '%s &mdash; %s' ) ),
            $string,
            $storeName
        );
    }

    public static function tableHasIndex( $tableName, $indexName )
    {
        $driver = DB::getDriverName();
        $tableName = self::getPrefixedTableName( $tableName );

        switch ( $driver ) {
            case 'mysql':
                return self::hasIndexMySQL( $tableName, $indexName );

            case 'sqlite':
                return self::hasIndexSQLite( $tableName, $indexName );

            case 'pgsql':
                return self::hasIndexPostgres( $tableName, $indexName );

            default:
                throw new Exception( "Unsupported database driver: {$driver}" );
        }
    }

    public static function hasIndexMySQL( string $tableName, string $indexName )
    {
        $result = DB::select( "
            SHOW INDEX FROM {$tableName} WHERE Key_name = ?
        ", [$indexName] );

        return ! empty( $result );
    }

    public static function hasIndexSQLite( string $tableName, string $indexName )
    {
        $result = DB::select( "
            SELECT name
            FROM sqlite_master
            WHERE type = 'index'
            AND tbl_name = ?
            AND name = ?
        ", [$tableName, $indexName] );

        return ! empty( $result );
    }

    public static function hasIndexPostgres( string $tableName, string $indexName )
    {
        $result = DB::select( '
            SELECT COUNT(*)
            FROM pg_indexes
            WHERE tablename = ?
            AND indexname = ?
        ', [$tableName, $indexName] );

        return $result[0]->count > 0;
    }

    public static function getPrefixedTableName( string $tableName )
    {
        $prefix = DB::getTablePrefix();

        return $prefix . $tableName;
    }

    /**
     * Checks if the "back" query parameter
     * has a valid URL otherwise uses the
     * previous URL stored on the session.
     */
    public static function getValidPreviousUrl( Request $request ): string
    {
        if ( $request->has( 'back' ) ) {
            $backUrl = $request->query( 'back' );
            $parsedUrl = parse_url( $backUrl );
            $host = $parsedUrl['host'];

            if ( filter_var( $backUrl, FILTER_VALIDATE_URL ) && $host === parse_url( env( 'APP_URL' ), PHP_URL_HOST ) ) {
                return urldecode( $backUrl );
            }
        }

        return url()->previous();
    }
}
