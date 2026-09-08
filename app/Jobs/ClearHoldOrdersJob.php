<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Role;
use App\Services\DateService;
use App\Services\NotificationService;
use App\Services\Options;
use App\Traits\SbSerialize;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

class ClearHoldOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SbSerialize, Queueable;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->prepareSerialization();
    }

    /**
     * Execute the job.
     *
     * @todo refactor to OrdersService
     *
     * @return void
     */
    public function handle(
        Options $options,
        DateService $date,
        NotificationService $notification
    ) {
        $expirationDays = $options->get( 'sb_orders_quotation_expiration', 'never' );

        // 'never' (or any non-numeric value) keeps held orders forever.
        // The old empty() guard proceeded on 'never' and would have deleted
        // every held order via addDays('never') treating it as 0 days.
        if ( $expirationDays === 'never' || ! is_numeric( $expirationDays ) ) {
            return;
        }

        $deleted = Order::paymentStatus( Order::PAYMENT_HOLD )
            ->get()
            ->filter( function ( $order ) use ( $expirationDays, $date ) {
                /**
                 * @var Carbon
                 */
                $expectedDate = Carbon::parse( $order->created_at )
                    ->addDays( (int) $expirationDays );

                if ( $expectedDate->lessThan( $date->now() ) ) {
                    /**
                     * @todo we might consider soft deleting for now
                     */
                    $order->delete();

                    return true;
                }

                return false;
            } );

        if ( $deleted->count() > 0 ) {
            /**
             * Dispatch notification
             * to let admins know it has been cleared.
             */
            $notification->create( [
                'title' => __( 'Hold Order Cleared' ),
                'identifier' => self::class,
                'description' => sprintf( __( '%s order(s) has recently been deleted as they have expired.' ), $deleted->count() ),
            ] )->dispatchForGroup( [
                Role::namespace( 'admin' ),
                Role::namespace( 'subul.store.administrator' ),
            ] );
        }
    }
}
