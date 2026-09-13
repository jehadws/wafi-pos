<?php

namespace App\Crud;

use App\Casts\CurrencyCast;
use App\Casts\DateCast;
use App\Casts\DiscountTypeCast;
use App\Classes\CrudTable;
use App\Exceptions\NotAllowedException;
use App\Models\OrderCoupon;
use App\Services\CrudEntry;
use App\Services\CrudService;
use Illuminate\Http\Request;
use TorMorten\Eventy\Facades\Events as Hook;

class CouponOrderHistoryCrud extends CrudService
{
    /**
     * Define the autoload status
     */
    const AUTOLOAD = true;

    /**
     * Define the identifier
     */
    const IDENTIFIER = 'sb.coupons-orders-history';

    /**
     * define the base table
     *
     * @param string
     */
    protected $table = 'subul_orders_coupons';

    /**
     * default slug
     *
     * The resource has no standalone page — it renders as the
     * coupon-scoped sub-list of the coupons page
     * (`/dashboard/customers/coupons/history/{coupon}`, T5.2). The slug
     * only feeds the breadcrumb through `getLinks()`.
     *
     * @param string
     */
    protected $slug = 'customers/coupons';

    /**
     * Define namespace
     *
     * @param string
     */
    protected $namespace = 'sb.coupons-orders-history';

    /**
     * Model Used
     *
     * @param string
     */
    protected $model = OrderCoupon::class;

    /**
     * Define permissions
     *
     * @param array
     */
    protected $permissions = [
        'create' => false,
        'read' => true,
        'update' => false,
        'delete' => false,
    ];

    protected $casts = [
        'type' => DiscountTypeCast::class,
        'value' => CurrencyCast::class,
        'created_at' => DateCast::class,
    ];

    /**
     * Adding relation
     * Example : [ 'subul_users as user', 'user.id', '=', 'subul_orders.author' ]
     *
     * @param array
     */
    public $relations = [
        [ 'subul_users as user', 'user.id', '=', 'subul_orders_coupons.author' ],
        [ 'subul_orders as order', 'order.id', '=', 'subul_orders_coupons.order_id' ],
        [ 'subul_users as customer', 'customer.id', '=', 'order.customer_id' ],
    ];

    /**
     * all tabs mentionned on the tabs relations
     * are ignored on the parent model.
     */
    protected $tabsRelations = [
        // 'tab_name'      =>      [ YourRelatedModel::class, 'localkey_on_relatedmodel', 'foreignkey_on_crud_model' ],
    ];

    /**
     * Export Columns defines the columns that
     * should be included on the exported csv file.
     */
    protected $exportColumns = []; // @getColumns will be used by default.

    /**
     * Pick
     * Restrict columns you retreive from relation.
     * Should be an array of associative keys, where
     * keys are either the related table or alias name.
     * Example : [
     *      'user'  =>  [ 'username' ], // here the relation on the table subul_users is using "user" as an alias
     * ]
     */
    public $pick = [
        'user' => [ 'username' ],
        'order' => [ 'id', 'code' ],
        'customer' => [ 'username', 'first_name', 'last_name' ],
    ];

    /**
     * Define where statement
     *
     * @var array
     **/
    protected $listWhere = [];

    /**
     * Define where in statement
     *
     * @var array
     */
    protected $whereIn = [];

    /**
     * If few fields should only be filled
     * those should be listed here.
     */
    public $fillable = [];

    /**
     * If fields should be ignored during saving
     * those fields should be listed here
     */
    public $skippable = [];

    /**
     * Determine if the options column should display
     * before the crud columns
     */
    protected $prependOptions = false;

    /**
     * Will make the options column available per row if
     * set to "true". Otherwise it will be hidden.
     */
    protected $showOptions = true;

    /**
     * Define Constructor
     */
    public function __construct()
    {
        parent::__construct();
    }

    public function hook( $query ): void
    {
        $query->where( 'coupon_id', request()->query( 'coupon_id' ) );
    }

    /**
     * Return the label used for the crud
     * instance
     *
     * @return array
     **/
    public function getLabels()
    {
        return CrudTable::labels(
            list_title: __( 'Coupon Order Histories List' ),
            list_description: __( 'Display all coupon order histories.' ),
            no_entry: __( 'No coupon order histories has been registered' ),
            create_new: __( 'Add a new coupon order history' ),
            create_title: __( 'Create a new coupon order history' ),
            create_description: __( 'Register a new coupon order history and save it.' ),
            edit_title: __( 'Edit coupon order history' ),
            edit_description: __( 'Modify  Coupon Order History.' ),
            back_to_list: __( 'Return to Coupon Order Histories' )
        );
    }

    /**
     * Filter POST input fields
     *
     * @param array of fields
     * @return array of fields
     */
    public function filterPostInputs( $inputs )
    {
        return $inputs;
    }

    /**
     * Filter PUT input fields
     *
     * @param array of fields
     * @return array of fields
     */
    public function filterPutInputs( $inputs, OrderCoupon $entry )
    {
        return $inputs;
    }

    /**
     * Before saving a record
     *
     * @param  Request $request
     * @return void
     */
    public function beforePost( $request )
    {
        if ( $this->permissions[ 'create' ] !== false ) {
            sb()->restrict( $this->permissions[ 'create' ] );
        } else {
            throw new NotAllowedException;
        }

        return $request;
    }

    /**
     * After saving a record
     *
     * @param  Request $request
     * @return void
     */
    public function afterPost( $request, OrderCoupon $entry )
    {
        return $request;
    }

    /**
     * get
     *
     * @param string
     * @return mixed
     */
    public function get( $param )
    {
        switch ( $param ) {
            case 'model': return $this->model;
                break;
        }
    }

    /**
     * Before updating a record
     *
     * @param Request $request
     * @param object entry
     * @return void
     */
    public function beforePut( $request, $entry )
    {
        if ( $this->permissions[ 'update' ] !== false ) {
            sb()->restrict( $this->permissions[ 'update' ] );
        } else {
            throw new NotAllowedException;
        }

        return $request;
    }

    /**
     * After updating a record
     *
     * @param Request $request
     * @param object entry
     * @return void
     */
    public function afterPut( $request, $entry )
    {
        return $request;
    }

    /**
     * Before Delete
     *
     * @return void
     */
    public function beforeDelete( $namespace, $id, $model )
    {
        if ( $namespace == 'sb.coupons-orders-history' ) {
            /**
             *  Perform an action before deleting an entry
             *  In case something wrong, this response can be returned
             *
             *  return response([
             *      'status'    =>  'danger',
             *      'message'   =>  __( 'You\re not allowed to do that.' )
             *  ], 403 );
             **/
            if ( $this->permissions[ 'delete' ] !== false ) {
                sb()->restrict( $this->permissions[ 'delete' ] );
            } else {
                throw new NotAllowedException;
            }
        }
    }

    /**
     * Define Columns
     */
    public function getColumns(): array
    {
        return CrudTable::columns(
            CrudTable::column( __( 'Name' ), 'name' ),
            CrudTable::column( __( 'Code' ), 'code' ),
            CrudTable::column( __( 'Customer' ), 'customer_first_name' ),
            CrudTable::column( __( 'Order' ), 'order_code' ),
            CrudTable::column( __( 'Type' ), 'type' ),
            CrudTable::column( __( 'Discount' ), 'discount_value' ),
            CrudTable::column( __( 'Value' ), 'value' ),
            CrudTable::column( __( 'Author' ), 'user_username' ),
            CrudTable::column( __( 'Created At' ), 'created_at' ),
        );
    }

    /**
     * Define actions
     *
     * The resource is read-only (create/update/delete permissions are
     * all `false`) and no per-entry form pages exist — the generic shell
     * renders no row actions (T5.2). The former Edit GOTO pointed at the
     * broken `/dashboard//edit/{id}` slug and the Delete was always
     * refused by `beforeDelete`.
     */
    public function setActions( CrudEntry $entry ): CrudEntry
    {
        return $entry;
    }

    /**
     * Bulk Delete Action
     *
     * @param  object Request with object
     * @return  false/array
     */
    public function bulkAction( Request $request )
    {
        /**
         * Deleting licence is only allowed for admin
         * and supervisor.
         */
        if ( $request->input( 'action' ) == 'delete_selected' ) {
            /**
             * Will control if the user has the permissoin to do that.
             */
            if ( $this->permissions[ 'delete' ] !== false ) {
                sb()->restrict( $this->permissions[ 'delete' ] );
            } else {
                throw new NotAllowedException;
            }

            $status = [
                'success' => 0,
                'error' => 0,
            ];

            foreach ( $request->input( 'entries' ) as $id ) {
                $entity = $this->model::find( $id );
                if ( $entity instanceof OrderCoupon ) {
                    $entity->delete();
                    $status[ 'success' ]++;
                } else {
                    $status[ 'error' ]++;
                }
            }

            return $status;
        }

        return Hook::filter( $this->namespace . '-catch-action', false, $request );
    }

    /**
     * get Links
     *
     * The list page lives at `/dashboard/customers/coupons/history/{coupon}`
     * (a coupon-scoped sub-list of the coupons page), so the breadcrumb
     * points back at the coupons list (T5.2). No create/edit targets —
     * the resource is read-only.
     *
     * @return array of links
     */
    public function getLinks(): array
    {
        return [
            'list' => sb()->url( 'dashboard/customers/coupons' ),
        ];
    }

    /**
     * get exports
     *
     * @return array of export formats
     **/
    public function getExports()
    {
        return [];
    }
}
