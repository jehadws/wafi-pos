<?php

namespace App\Crud;

use App\Exceptions\NotAllowedException;
use App\Models\Customer;
use App\Models\OrderCoupon;
use App\Services\CrudEntry;
use App\Services\CrudService;
use Illuminate\Http\Request;
use TorMorten\Eventy\Facades\Events as Hook;

class CustomerCouponHistoryCrud extends CrudService
{
    /**
     * Define the autoload status
     */
    const AUTOLOAD = true;

    /**
     * Define the identifier
     */
    const IDENTIFIER = 'sb.customers-coupons-history';

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
     * customer-coupon usage sub-list
     * (`/dashboard/customers/{customer}/coupons/{customerCoupon}/history`,
     * T5.3). The slug only feeds the breadcrumb through `getLinks()`.
     *
     * @param string
     */
    protected $slug = 'customers/coupons';

    /**
     * Define namespace
     *
     * @param string
     */
    protected $namespace = 'sb.customers-coupons-history';

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

    /**
     * Adding relation
     * Example : [ 'subul_users as user', 'user.id', '=', 'subul_orders.author' ]
     *
     * @param array
     */
    public $relations = [
        [ 'subul_orders as order', 'order.id', '=', 'subul_orders_coupons.order_id' ],
        [ 'subul_coupons as coupon', 'coupon.id', '=', 'subul_orders_coupons.coupon_id' ],
        [ 'subul_users as user', 'user.id', '=', 'subul_orders_coupons.author' ],
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
        'order' => [ 'code' ],
        'coupon' => [ 'name' ],
        'user' => [ 'username' ],
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
     * Here goes the CRUD constructor. Here you can change the behavior
     * of the crud component.
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Return the label used for the crud object.
     **/
    public function getLabels(): array
    {
        return [
            'list_title' => __( 'Customer Coupon Histories List' ),
            'list_description' => __( 'Display all customer coupon histories.' ),
            'no_entry' => __( 'No customer coupon histories has been registered' ),
            'create_new' => __( 'Add a new customer coupon history' ),
            'create_title' => __( 'Create a new customer coupon history' ),
            'create_description' => __( 'Register a new customer coupon history and save it.' ),
            'edit_title' => __( 'Edit customer coupon history' ),
            'edit_description' => __( 'Modify  Customer Coupon History.' ),
            'back_to_list' => __( 'Return to Customer Coupon Histories' ),
        ];
    }

    /**
     * Defines the forms used to create and update entries.
     */
    public function getForm( ?OrderCoupon $entry = null ): array
    {
        return [
            // ...
        ];
    }

    /**
     * Filter POST input fields
     *
     * @param array of fields
     * @return array of fields
     */
    public function filterPostInputs( $inputs ): array
    {
        return $inputs;
    }

    /**
     * Filter PUT input fields
     *
     * @param array of fields
     * @return array of fields
     */
    public function filterPutInputs( array $inputs, OrderCoupon $entry )
    {
        return $inputs;
    }

    /**
     * Trigger actions that are executed before the
     * crud entry is created.
     */
    public function beforePost( array $request ): array
    {
        if ( $this->permissions[ 'create' ] !== false ) {
            sb()->restrict( $this->permissions[ 'create' ] );
        } else {
            throw new NotAllowedException;
        }

        return $request;
    }

    /**
     * Trigger actions that will be executed
     * after the entry has been created.
     */
    public function afterPost( array $request, OrderCoupon $entry ): array
    {
        return $request;
    }

    /**
     * A shortcut and secure way to access
     * senstive value on a read only way.
     */
    public function get( string $param ): mixed
    {
        switch ( $param ) {
            case 'model': return $this->model;
                break;
        }
    }

    /**
     * Trigger actions that are executed before
     * the crud entry is updated.
     */
    public function beforePut( array $request, OrderCoupon $entry ): array
    {
        if ( $this->permissions[ 'update' ] !== false ) {
            sb()->restrict( $this->permissions[ 'update' ] );
        } else {
            throw new NotAllowedException;
        }

        return $request;
    }

    /**
     * This trigger actions that are executed after
     * the crud entry is successfully updated.
     */
    public function afterPut( array $request, OrderCoupon $entry ): array
    {
        return $request;
    }

    /**
     * This triggers actions that will be executed ebfore
     * the crud entry is deleted.
     */
    public function beforeDelete( $namespace, $id, $model ): void
    {
        if ( $namespace == 'sb.customers-coupons-history' ) {
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
     * Define Columns and how it is structured.
     */
    public function getColumns(): array
    {
        return [
            'name' => [
                'label' => __( 'Name' ),
                '$direction' => '',
                '$sort' => false,
            ],
            'value' => [
                'label' => __( 'Value' ),
                '$direction' => '',
                '$sort' => false,
            ],
            'order_code' => [
                'label' => __( 'Order Code' ),
                '$direction' => '',
                '$sort' => false,
            ],
            'coupon_name' => [
                'label' => __( 'Coupon Name' ),
                '$direction' => '',
                '$sort' => false,
            ],
            'user_username' => [
                'label' => __( 'Author' ),
                '$direction' => '',
                '$sort' => false,
            ],
            'created_at' => [
                'label' => __( 'Created At' ),
                '$direction' => '',
                '$sort' => false,
            ],
        ];
    }

    /**
     * Define row actions.
     *
     * The resource is read-only (create/update/delete permissions are
     * all `false`) and no per-entry form pages exist — the generic shell
     * renders no row actions (T5.3). The former Edit GOTO pointed at the
     * broken `/dashboard//edit/{id}` slug and the Delete was always
     * refused by `beforeDelete`.
     */
    public function setActions( CrudEntry $entry ): CrudEntry
    {
        $entry->value = (string) sb()->currency->define( $entry->value );

        return $entry;
    }

    /**
     * trigger actions that are executed
     * when a bulk actio is posted.
     */
    public function bulkAction( Request $request ): array
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

    public function hook( $query ): void
    {
        $query->where( 'customer_coupon_id', request()->query( 'customer_coupon_id' ) );
    }

    /**
     * Defines links used on the CRUD object.
     *
     * The list page lives at
     * `/dashboard/customers/{customer}/coupons/{customerCoupon}/history`
     * (a sub-list of the owning customer's coupons page), so the
     * breadcrumb points back at that page through the bound route
     * `customer` (T5.3). No create/edit targets — the resource is
     * read-only.
     */
    public function getLinks(): array
    {
        $customer = request()->route( 'customer' );
        $customerId = $customer instanceof Customer ? $customer->id : request()->query( 'customer_id' );

        return [
            'list' => sb()->url( 'dashboard/customers/' . $customerId . '/coupons' ),
        ];
    }

    /**
     * Get Bulk actions
     *
     * Read-only resource (`delete => false`): the generated
     * `delete_selected` entry was always refused by `bulkAction()`, so
     * the list stays empty. The Hook filter is preserved so modules can
     * still register their own bulk actions.
     *
     * @return array of actions
     **/
    public function getBulkActions(): array
    {
        return Hook::filter( $this->namespace . '-bulk', [] );
    }

    /**
     * Defines the export configuration.
     **/
    public function getExports(): array
    {
        return [];
    }
}
