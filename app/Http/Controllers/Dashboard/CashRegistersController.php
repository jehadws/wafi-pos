<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Classes\Hook;
use App\Crud\RegisterCrud;
use App\Crud\RegisterHistoryCrud;
use App\Exceptions\NotAllowedException;
use App\Http\Controllers\DashboardController;
use App\Models\OrderPayment;
use App\Models\PaymentType;
use App\Models\Register;
use App\Models\RegisterHistory;
use App\Services\CashRegistersService;
use App\Services\DateService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashRegistersController extends DashboardController
{
    public function __construct(
        protected CashRegistersService $registersService,
        protected DateService $dateService
    ) {
        // ...
    }

    public function listRegisters()
    {
        /**
         * The single backend-driven list shell (T4.7): the cash-registers
         * table renders from `RegisterCrud::table()` — the Register History
         * GOTO renders from `$actions` and delete is omitted per-row for
         * opened registers (server-conditional action). `table()` enforces
         * `allowedTo('read')` internally.
         */
        return RegisterCrud::table();
    }

    public function createRegister()
    {
        /**
         * The single backend-driven form shell (Phase 7): the register create
         * form renders from `RegisterCrud::form()` — the config travels inline
         * as `initialConfig` (no client-side form-config round-trip). `form()`
         * enforces `allowedTo` internally.
         */
        return RegisterCrud::form();
    }

    public function editRegister( Register $register )
    {
        if ( $register->status === Register::STATUS_OPENED ) {
            throw new NotAllowedException( __( 'Unable to edit a register that is currently in use' ) );
        }

        /**
         * Same generic form shell, pre-filled from the route-bound register.
         */
        return RegisterCrud::form($register);
    }

    public function getRegisters( $register_id = null )
    {
        if ( $register_id !== null ) {
            $register = Register::findOrFail( $register_id );
            $this->registersService->getRegisterDetails( $register );

            return $register;
        }

        return Register::get()->map( function ( $register ) {
            $this->registersService->getRegisterDetails( $register );

            return $register;
        } );
    }

    /**
     * @todo check repetitive transactions
     */
    public function performAction( Request $request, $action, Register $register )
    {
        if ( $action === 'open' ) {
            return $this->registersService->openRegister(
                $register,
                $request->input( 'amount' ),
                $request->input( 'description' )
            );
        } elseif ( $action === RegisterHistory::ACTION_OPENING ) {
            return $this->registersService->openRegister(
                $register,
                $request->input( 'amount' ),
                $request->input( 'description' )
            );
        } elseif ( $action === 'close' ) {
            return $this->registersService->closeRegister(
                $register,
                $request->input( 'amount' ),
                $request->input( 'description' )
            );
        } elseif ( $action === RegisterHistory::ACTION_CLOSING ) {
            return $this->registersService->closeRegister(
                $register,
                $request->input( 'amount' ),
                $request->input( 'description' )
            );
        } elseif ( $action === RegisterHistory::ACTION_CASHING ) {
            return $this->registersService->cashIng(
                register: $register,
                amount: $request->input( 'amount' ),
                description: $request->input( 'description' )
            );
        } elseif ( $action === RegisterHistory::ACTION_CASHOUT ) {
            return $this->registersService->cashOut(
                register: $register,
                amount: $request->input( 'amount' ),
                description: $request->input( 'description' )
            );
        }
    }

    public function getUsedRegister()
    {
        $register = Register::opened()
            ->usedBy( Auth::id() )
            ->first();

        if ( ! $register instanceof Register ) {
            throw new NotAllowedException( __( 'No register has been opened by the logged user.' ) );
        }

        return [
            'status' => 'success',
            'message' => __( 'The register is opened.' ),
            'data' => compact( 'register' ),
        ];
    }

    private function getRightOrderPaymentLabel( RegisterHistory $history )
    {
        if ( $history->action === RegisterHistory::ACTION_ORDER_PAYMENT ) {
            return sprintf(
                __( 'Payment %s on %s' ),
                $history->payment_label,
                $history->order->code
            );
        } elseif ( $history->action === RegisterHistory::ACTION_ORDER_CHANGE ) {
            return sprintf(
                __( 'Change %s on %s' ),
                $history->payment_label,
                $history->order->code
            );
        }

        return sprintf(
            __( 'Unknown action %s' ),
            $history->action
        );
    }

    public function getSessionHistory( Register $register )
    {
        if ( $register->status === Register::STATUS_OPENED ) {
            $lastOpening = $register->history()
                ->where( 'action', RegisterHistory::ACTION_OPENING )
                ->orderBy( Hook::filter( 'sb-table-name', 'subul_registers_history' ) . '.id', 'desc' )
                ->first();

            if ( $lastOpening instanceof RegisterHistory ) {
                /**
                 * @var Builder
                 */
                $historyRequest = $register->history()
                    ->select( [
                        'subul_registers_history.*',
                        'subul_registers_history.description as description',
                        'subul_payments_types.label as payment_label',
                    ] )
                    ->with( 'order' )
                    ->leftJoin( 'subul_payments_types', 'subul_registers_history.payment_type_id', '=', 'subul_payments_types.id' )
                    ->where( 'subul_registers_history.id', '>=', $lastOpening->id );

                $history = $historyRequest->get();

                $history->each( function ( RegisterHistory $session ) {
                    switch ( $session->action ) {
                        case RegisterHistory::ACTION_CASHING:
                            $session->label = __( 'Cash In' );
                            break;
                        case RegisterHistory::ACTION_CASHOUT:
                            $session->label = __( 'Cash Out' );
                            break;
                        case RegisterHistory::ACTION_CLOSING:
                            $session->label = __( 'Closing' );
                            break;
                        case RegisterHistory::ACTION_OPENING:
                            $session->label = __( 'Opening' );
                            break;
                        case RegisterHistory::ACTION_ORDER_PAYMENT:
                        case RegisterHistory::ACTION_ORDER_CHANGE:
                            // @todo it might be a custom label based on the payment
                            $session->label = $this->getRightOrderPaymentLabel( $session );
                            break;
                        case RegisterHistory::ACTION_REFUND:
                            $session->label = __( 'Refund' );
                            break;
                    }
                } );

                $totalDisbursement = $history->where( 'action', RegisterHistory::ACTION_CASHOUT )->sum( 'value' );
                $totalCashIn = $history->where( 'action', RegisterHistory::ACTION_CASHING )->sum( 'value' );

                $cashPayment = PaymentType::identifier( OrderPayment::PAYMENT_CASH )->first();
                $totalOpening = $lastOpening->value;

                // we might need to pull based on payment type
                // @todo this is no longer correct
                $totalCashPayment = $history->where( 'action', RegisterHistory::ACTION_ORDER_PAYMENT )
                    ->where( 'payment_type_id', $cashPayment->id ?? 0 )
                    ->sum( 'value' );

                $totalCashChange = $history->where( 'action', RegisterHistory::ACTION_ORDER_CHANGE )->sum( 'value' );

                $totalPaymentTypeSummary = $register->history()
                    ->leftJoin( 'subul_payments_types', 'subul_registers_history.payment_type_id', '=', 'subul_payments_types.id' )
                    ->where( 'subul_registers_history.id', '>=', $lastOpening->id )
                    ->where( 'subul_registers_history.action', RegisterHistory::ACTION_ORDER_PAYMENT )
                    ->select( [
                        DB::raw( 'SUM(subul_registers_history.value) as value' ),
                        'subul_payments_types.label as label',
                        'subul_registers_history.action as action',
                    ] )
                    ->groupBy( [ 'subul_registers_history.action', 'subul_payments_types.label' ] )
                    ->get()
                    ->map( function ( $group ) {
                        return [
                            'label' => sprintf( __( 'Total %s' ), $group->label ),
                            'value' => (float) $group->value,
                            'color' => 'success',
                        ];
                    } );

                $summary = [
                    [
                        'label' => __( 'Initial Balance' ),
                        'value' => $totalOpening,
                        'color' => 'info',
                    ],
                    ...$totalPaymentTypeSummary,
                    [
                        'label' => __( 'Total Change' ),
                        'value' => $totalCashChange,
                        'color' => 'warning',
                    ],
                    [
                        'label' => __( 'On Hand' ),
                        'value' => sb()->currency->define( $totalOpening )
                            ->additionateBy( $totalCashPayment )
                            ->additionateBy( $totalCashIn )
                            ->subtractBy(
                                sb()->currency->define( $totalCashChange )
                                    ->additionateBy( $totalDisbursement )
                                    ->toFloat()
                            )->toFloat(),
                        'color' => 'info',
                    ],
                ];

                return compact(
                    'history',
                    'summary'
                );
            }

            throw new NotAllowedException( __( 'The register doesn\'t have an history.' ) );
        }

        throw new NotAllowedException( __( 'Unable to check a register session history if it\'s closed.' ) );
    }

    /**
     * returns the cahs register instance
     *
     * @return string
     */
    public function getRegisterHistory( Register $register )
    {
        return RegisterHistoryCrud::table( [
            'title' => sprintf( __( 'Register History For : %s' ), $register->name ),
            'queryParams' => [
                'register_id' => $register->id,
            ],
        ] );
    }

    public function getRegisterZReport( Register $register )
    {
        $data = $this->registersService->getZReport( $register );

        return Inertia::render( 'dashboard/orders/templates/z-report/page', [
            'register' => $data->register,
            'opening' => $data->opening,
            'closing' => $data->closing,
            'openedOn' => $data->openedOn,
            'closedOn' => $data->closedOn,
            'histories' => $data->histories,
            'orders' => $data->orders,
            'openingBalance' => method_exists( $data->openingBalance, 'toFloat' ) ? $data->openingBalance->toFloat() : (float) $data->openingBalance,
            'closingBalance' => method_exists( $data->closingBalance, 'toFloat' ) ? $data->closingBalance->toFloat() : (float) $data->closingBalance,
            'difference' => $data->difference,
            'totalGrossSales' => method_exists( $data->totalGrossSales, 'toFloat' ) ? $data->totalGrossSales->toFloat() : (float) $data->totalGrossSales,
            'totalDiscounts' => method_exists( $data->totalDiscounts, 'toFloat' ) ? $data->totalDiscounts->toFloat() : (float) $data->totalDiscounts,
            'totalShippings' => method_exists( $data->totalShippings, 'toFloat' ) ? $data->totalShippings->toFloat() : (float) $data->totalShippings,
            'totalTaxes' => method_exists( $data->totalTaxes, 'toFloat' ) ? $data->totalTaxes->toFloat() : (float) $data->totalTaxes,
            'totalSales' => method_exists( $data->totalSales, 'toFloat' ) ? $data->totalSales->toFloat() : (float) $data->totalSales,
            'categories' => array_values( $data->categories ),
            'cashier' => $data->cashier,
            'sessionDuration' => $data->sessionDuration,
            'payments' => $data->payments,
            'cashOnHand' => $data->cashOnHand,
            'products' => array_values( $data->products ),
            'user' => $data->user,
            'title' => sprintf( __( 'Z-Report &mdash; %s' ), $register->name ),
        ] );
    }
}
