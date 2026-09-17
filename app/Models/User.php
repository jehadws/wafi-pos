<?php

namespace App\Models;

use App\Classes\Model;
use App\Services\UserOptions;
use App\Traits\SbDependable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int    $id
 * @property string $username
 * @property bool   $active
 * @property int    $author
 * @property string $email
 * @property string $password
 * @property string $activation_token
 * @property string $activation_expiration
 * @property int    $total_sales_count
 * @property float  $total_sales
 * @property string $remember_token
 * @property string $created_at
 * @property string $updated_at
 */
class User extends Authenticatable
{
    use HasApiTokens,
        HasFactory,
        Notifiable,
        SbDependable;

    protected $table = 'subul_users';

    protected $casts = [
        'active'                => 'boolean',
        'activation_expiration' => 'datetime',
        'birth_date'            => 'datetime',
        'total_sales_count'     => 'integer',
        'total_sales'           => 'float',
        'purchases_amount'      => 'float',
        'owed_amount'           => 'float',
        'credit_limit_amount'   => 'float',
        'account_amount'        => 'float',
    ];

    /**
     * @var App\Services\UserOptions;
     */
    public $options;

    public $user_id;

    public function setDependencies()
    {
        return [
            Product::class => Model::dependant(
                local_name: 'username',
                local_index: 'id',
                foreign_name: 'name',
                foreign_index: 'author',
            ),
            Order::class => Model::dependant(
                local_name: 'username',
                local_index: 'id',
                foreign_name: 'code',
                foreign_index: 'author',
            ),
        ];
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'username',
        'active',
        'author',
        'email',
        'password',
        'group_id',
        'first_name',
        'last_name',
        'gender',
        'phone',
        'pobox',
        'activation_expiration',
        'total_sales_count',
        'total_sales',
        'birth_date',
        'purchases_amount',
        'owed_amount',
        'credit_limit_amount',
        'account_amount',
        'activation_token',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    /**
     * Permission for a specific user
     *
     * @var array
     */
    protected static $permissions = [];

    private $storedPermissions = [];

    public function __construct( $attributes = [] )
    {
        parent::__construct( $attributes );
    }

    /**
     * While saving model, this will
     * use the timezone defined on the settings
     */
    public function freshTimestamp()
    {
        return sb()->date->getNow();
    }

    /**
     * Define the relation with the user attribute.
     */
    public function attribute(): HasOne
    {
        return $this->hasOne( UserAttribute::class, 'user_id', 'id' );
    }

    /**
     * Relation with the billing/shipping metadata rows (Phase 7,
     * docs/plans/backend-driven-completion/07): `UserCrud::getForm` seeds the
     * renamed `billing_*`/`shipping_*` tabs from them — the same accessors
     * the hand edit page hydrated manually (`CustomerAddress` rows typed
     * billing/shipping). Mirrors `Customer::billing()`/`Customer::shipping()`.
     */
    public function billing(): HasOne
    {
        return $this->hasOne(
            related: CustomerBillingAddress::class,
            foreignKey: 'customer_id',
            localKey: 'id'
        );
    }

    public function shipping(): HasOne
    {
        return $this->hasOne(
            related: CustomerShippingAddress::class,
            foreignKey: 'customer_id',
            localKey: 'id'
        );
    }

    /**
     * Relation with roles
     **/
    public function roles(): HasManyThrough
    {
        return $this->hasManyThrough(
            Role::class,
            UserRoleRelation::class,
            'user_id',
            'id',
            'id',
            'role_id'
        );
    }

    /**
     * Assign user to a role
     */
    public function assignRole( $roleName )
    {
        if ( $role = Role::namespace( $roleName ) ) {
            $combinaison = UserRoleRelation::combinaison( $this, $role )->first();

            if ( ! $combinaison instanceof UserRoleRelation ) {
                $combinaison = new UserRoleRelation;
            }

            $combinaison->user_id = $this->id;
            $combinaison->role_id = $role->id;
            $combinaison->save();

            return [
                'status' => 'success',
                'message' => __( 'The role was successfully assigned.' ),
            ];
        } elseif ( is_array( $roleName ) ) {
            collect( $roleName )->each( fn( $role ) => $this->assignRole( $role ) );

            return [
                'status' => 'success',
                'message' => __( 'The role were successfully assigned.' ),
            ];
        }

        return [
            'status' => 'error',
            'message' => __( 'Unable to identifier the provided role.' ),
        ];
    }

    public function scopeActive()
    {
        return $this->where( 'active', true );
    }

    /**
     * Quick access to user options
     */
    public function options( $option, $default = null )
    {
        $options = new UserOptions( $this->id );

        return $options->get( $option, $default );
    }
}
