<?php

namespace App\Crud;

use App\Casts\CurrencyCast;
use App\Casts\GenderCast;
use App\Casts\NotDefinedCast;
use App\Casts\YesNoBoolCast;
use App\Classes\CrudTable;
use App\Classes\JsonResponse;
use App\Events\UserAfterActivationSuccessfulEvent;
use App\Exceptions\NotAllowedException;
use App\Models\CustomerBillingAddress;
use App\Models\CustomerGroup;
use App\Models\CustomerShippingAddress;
use App\Models\Role;
use App\Models\User;
use App\Services\CrudEntry;
use App\Services\CrudService;
use App\Services\Helper;
use App\Services\Options;
use App\Services\UsersService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use TorMorten\Eventy\Facades\Events as Hook;

class UserCrud extends CrudService
{
  /**
   * Define the autoload status
   */
  const AUTOLOAD = true;

  /**
   * Define the identifier
   */
  const IDENTIFIER = 'sb.users';

  /**
   * define the base table
   */
  protected $table = 'subul_users';

  /**
   * base route name
   */
  protected $mainRoute = 'sb.users';

  /**
   * Define namespace
   *
   * @param  string
   */
  protected $namespace = 'sb.users';

  /**
   * Model Used
   */
  protected $model = User::class;

  /**
   * Define option attributes for search-select
   */
  protected $optionAttributes = [
    'label' => 'username',
    'value' => 'id',
  ];

  /**
   * Determine if the options column should display
   * before the crud columns
   */
  protected $prependOptions = true;

  public $to_route = 'sb.dashboard.users';
  /**
   * Adding relation
   */
  public $relations = [
    'leftJoin' => [
      ['subul_customers_groups as group', 'subul_users.group_id', '=', 'group.id'],
      ['subul_users as author', 'subul_users.author', '=', 'author.id'],
    ],
  ];

  public $pick = [
    'author' => ['username'],
    'role' => ['name'],
    'group' => ['id', 'name'],
  ];

  protected $permissions = [
    'create' => 'create.users',
    'read' => 'read.users',
    'update' => 'update.users',
    'delete' => 'delete.users',
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
   * Fields which will be filled during post/put
   */
  public $fillable = [
    'username',
    'email',
    'password',
    'active',
    'role_id',
    'group_id',
    'first_name',
    'last_name',
    'phone',
    'gender',
    'pobox',
    'birth_date',
    'credit_limit_amount',
  ];

  /**
   * Phase 7 (docs/plans/backend-driven-completion/07): the billing/shipping
   * tabs are no longer tabs-relations. Their fields are renamed
   * (`billing_*`/`shipping_*` — L8.2 option 1, same unblock as the Phase 6
   * customers) so every name is unique across the form, `getFlatForm`
   * therefore flattens them into the payload, and the metadata write happens
   * in afterPost/afterPut through `saveAddressesMetadata()` →
   * `CrudService::saveTabRelation()` — the exact writer the removed generic
   * loop used. The `birth_date` field joins `$fillable` (the model already
   * fillable-izes it) so the general-tab field actually round-trips instead
   * of being silently dropped by the generic assignment loop.
   */

  protected $casts = [
    'first_name' => NotDefinedCast::class,
    'last_name' => NotDefinedCast::class,
    'phone' => NotDefinedCast::class,
    'owed_amount' => CurrencyCast::class,
    'account_amount' => CurrencyCast::class,
    'purchases_amount' => CurrencyCast::class,
    'gender' => GenderCast::class,
    'active' => YesNoBoolCast::class,
  ];

  private Options $options;

  private UsersService $userService;

  /**
   * Define Constructor
   */
  public function __construct()
  {
    parent::__construct();

    $this->userService = app()->make(UsersService::class);
    $this->options = app()->make(Options::class);
  }

  /**
   * Return the label used for the crud
   * instance
   *
   * @return array
   **/
  public function getLabels()
  {
    return [
      'list_title' => __('Users List'),
      'list_description' => __('Display all users.'),
      'no_entry' => __('No users has been registered'),
      'create_new' => __('Add a new user'),
      'create_title' => __('Create a new user'),
      'create_description' => __('Register a new user and save it.'),
      'edit_title' => __('Edit user'),
      'edit_description' => __('Modify  User.'),
      'back_to_list' => __('Return to Users'),
    ];
  }

  /**
   * Check whether a feature is enabled
   *
   **/
  public function isEnabled($feature): bool
  {
    return false; // by default
  }

  /**
   * Fields
   *
   * @param  object/null
   * @return array of field
   */
  public function getForm($entry = null)
  {
    return [
      'main' => [
        'label' => __('Username'),
        'name' => 'username',
        'value' => $entry->username ?? '',
        'validation' => $entry === null ? 'required|unique:subul_users,username' : [
          'required',
          Rule::unique('subul_users', 'username')->ignore($entry->id),
        ],
        'description' => __('Provide a name to the resource.'),
      ],
      'tabs' => [
        'general' => [
          'label' => __('General'),
          'fields' => [
            [
              'type' => 'text',
              'name' => 'email',
              'label' => __('Email'),
              'validation' => $entry === null ? 'required|email|unique:subul_users,email' : [
                'required',
                'email',
                Rule::unique('subul_users', 'email')->ignore($entry->id),
              ],
              'description' => __('Will be used for various purposes such as email recovery.'),
              'value' => $entry->email ?? '',
            ],
            [
              'type' => 'text',
              'name' => 'first_name',
              'value' => $entry?->first_name,
              'label' => __('First Name'),
              'description' => __('Provide the user first name.'),
            ],
            [
              'type' => 'text',
              'name' => 'last_name',
              'value' => $entry?->last_name,
              'label' => __('Last Name'),
              'description' => __('Provide the user last name.'),
            ],
            [
              'type' => 'password',
              'name' => 'password',
              'label' => __('Password'),
              'validation' => 'sometimes|min:6',
              'description' => __('Make a unique and secure password.'),
            ],
            [
              'type' => 'password',
              'name' => 'password_confirm',
              'validation' => 'sometimes|same:general.password',
              'label' => __('Confirm Password'),
              'description' => __('Should be the same as the password.'),
            ],
            [
              'type' => 'switch',
              'options' => Helper::kvToJsOptions([__('No'), __('Yes')]),
              'name' => 'active',
              'label' => __('Active'),
              'description' => __('Define whether the user can use the application.'),
              'value' => ($entry !== null && $entry->active ? 1 : 0) ?? 0,
            ],
            [
              'type' => 'multiselect',
              'options' => Helper::toJsOptions(Role::get(), ['id', 'name']),
              'description' => __('Define what roles applies to the user'),
              'name' => 'roles',
              'label' => __('Roles'),
              'value' => $entry !== null ? ($entry->roles()->get()->map(fn($role) => $role->id)->toArray() ?? '') : [],
            ],
            [
              'type' => 'select',
              'label' => __('Group'),
              'name' => 'group_id',
              'value' => $entry->group_id ?? '',
              'options' => Helper::toJsOptions(CustomerGroup::all(), ['id', 'name']),
              'description' => __('Assign the customer to a group'),
            ],
            [
              'type' => 'datetimepicker',
              'label' => __('Birth Date'),
              'name' => 'birth_date',
              'value' => $entry instanceof User && $entry->birth_date !== null ? Carbon::parse($entry->birth_date)->format('Y-m-d H:i:s') : null,
              'description' => __('Displays the customer birth date'),
            ],
            [
              'type' => 'text',
              'name' => 'credit_limit_amount',
              'value' => $entry?->credit_limit_amount,
              'label' => __('Credit Limit'),
              'description' => __('Set the limit that can\'t be exceeded by the user.'),
            ],
            [
              'type' => 'select',
              'name' => 'gender',
              'value' => $entry?->gender,
              'label' => __('Gender'),
              'options' => Helper::kvToJsOptions([
                '' => __('Not Defined'),
                'male' => __('Male'),
                'female' => __('Female'),
              ]),
              'description' => __('Set the user gender.'),
            ],
            [
              'type' => 'text',
              'name' => 'phone',
              'value' => $entry?->phone,
              'label' => __('Phone'),
              'validation' => collect([
                sb()->option->get('sb_customers_force_unique_phone', 'no') === 'yes' ? (
                  $entry instanceof User && ! empty($entry->phone) ? Rule::unique('subul_users', 'phone')->ignore($entry->id) : Rule::unique('subul_users', 'phone')
                ) : '',
              ])->toArray(),
              'description' => __('Set the user phone number.'),
            ],
            [
              'type' => 'text',
              'name' => 'pobox',
              'value' => $entry?->pobox,
              'label' => __('PO Box'),
              'description' => __('Set the user PO Box.'),
            ],
          ],
        ],
        'billing' => [
          'label' => __('Billing Address'),
          'fields' => $this->userAddressTabFields('billing', $entry),
        ],
        'shipping' => [
          'label' => __('Shipping Address'),
          'fields' => $this->userAddressTabFields('shipping', $entry),
        ],
      ],
    ];
  }

  /**
   * Phase 7: the address fields with a unique `billing_`/`shipping_` name
   * prefix (L8.2 option 1 — cheapest unblock for the duplicate-field-name
   * collapse in `SbForms::getFlatForm`, same as the Phase 6 customers).
   * Labels/descriptions are byte-identical to the pre-rename tabs
   * (translation keys untouched); only the `name` is prefixed and the value
   * seeding goes through the nullsafe metadata accessors (`User::billing` /
   * `User::shipping`). No validation strings — the address metadata carries
   * no server-side rules anywhere today, so the form stays in parity with
   * the generic tabs-relation loop it replaces.
   */
  private function userAddressTabFields(string $prefix, $entry): array
  {
    $address = $prefix === 'billing' ? $entry?->billing : $entry?->shipping;

    $specs = match ($prefix) {
      'billing' => [
        ['first_name', __('First Name'), __('Provide the billing First Name.')],
        ['last_name', __('Last name'), __('Provide the billing last name.')],
        ['phone', __('Phone'), __('Billing phone number.')],
        ['address_1', __('Address 1'), __('Billing First Address.')],
        ['address_2', __('Address 2'), __('Billing Second Address.')],
        ['country', __('Country'), __('Billing Country.')],
        ['city', __('City'), __('City')],
        ['pobox', __('PO.Box'), __('Postal Address')],
        ['company', __('Company'), __('Company')],
        ['email', __('Email'), __('Email')],
      ],
      'shipping' => [
        ['first_name', __('First Name'), __('Provide the shipping First Name.')],
        ['last_name', __('Last Name'), __('Provide the shipping Last Name.')],
        ['phone', __('Phone'), __('Shipping phone number.')],
        ['address_1', __('Address 1'), __('Shipping First Address.')],
        ['address_2', __('Address 2'), __('Shipping Second Address.')],
        ['country', __('Country'), __('Shipping Country.')],
        ['city', __('City'), __('City')],
        ['pobox', __('PO.Box'), __('Postal Address')],
        ['company', __('Company'), __('Company')],
        ['email', __('Email'), __('Email')],
      ],
    };

    return collect($specs)->map(fn ($spec) => [
      'type' => 'text',
      'name' => $prefix . '_' . $spec[0],
      'value' => $address?->{$spec[0]} ?? '',
      'label' => $spec[1],
      'description' => $spec[2],
    ])->toArray();
  }

  /**
   * Phase 7: write the billing/shipping metadata from the flattened crud
   * payload. The backend-driven form submits `billing_first_name`,
   * `shipping_city`, … — those are stripped of their prefix and persisted
   * as `CustomerBillingAddress` / `CustomerShippingAddress` rows through
   * `CrudService::saveTabRelation()`, the same code path the generic
   * tabs-relation loop (and therefore the pre-Phase-7 payload) used.
   * Bare `first_name`/`phone` keys (legacy flat payloads) pass through
   * unprefixed onto the billing/shipping rows respectively, keeping those
   * payloads working.
   */
  private function saveAddressesMetadata(array $inputs, User $user): void
  {
    $crudService = app()->make(CrudService::class);

    $addressFields = [
      'first_name', 'last_name', 'phone', 'address_1', 'address_2',
      'country', 'city', 'pobox', 'company', 'email',
    ];

    foreach (['billing' => CustomerBillingAddress::class, 'shipping' => CustomerShippingAddress::class] as $prefix => $relationClass) {
      $fields = [];

      foreach ($inputs as $name => $value) {
        if (str_starts_with((string) $name, $prefix . '_')) {
          $fields[substr((string) $name, strlen($prefix) + 1)] = $value;
        } elseif (in_array((string) $name, $addressFields, true)) {
          $fields[$name] = $value;
        }
      }

      if (! empty($fields)) {
        $crudService->saveTabRelation([$relationClass, 'customer_id', 'id'], $user, $fields);
      }
    }
  }

  /**
   * Filter POST input fields
   *
   * @param  array of fields
   * @return array of fields
   */
  public function filterPostInputs($inputs)
  {
    unset($inputs['password_confirm']);

    /**
     * Phase 7: the prefixed address fields are metadata (persisted in
     * afterPost through saveAddressesMetadata), not users-table columns —
     * strip them so the generic assignment loop never sees them.
     */
    $inputs = collect($inputs)->reject(fn($value, $key) => str_starts_with((string) $key, 'billing_') || str_starts_with((string) $key, 'shipping_'))->toArray();

    /**
     * if the password is not changed, no
     * need to hash it
     */
    $inputs = collect($inputs)->filter(fn($input) => ! empty($input) || $input === 0)->toArray();

    if (! empty($inputs['password'])) {
      $inputs['password'] = Hash::make($inputs['password']);
    }

    return collect($inputs)->map(function ($value, $key) {
      if ($key === 'group_id' && empty($value)) {
        $value = $this->options->get('sb_customers_default_group', false);
        $group = CustomerGroup::find($value);

        if (! $group instanceof CustomerGroup) {
          throw new NotAllowedException(__('The assigned default customer group doesn\'t exist or is not defined.'));
        }
      }

      return $value;
    })->toArray();
  }

  /**
   * Filter PUT input fields
   *
   * @param  array of fields
   * @return array of fields
   */
  public function filterPutInputs($inputs, User $entry)
  {
    unset($inputs['password_confirm']);

    /**
     * Phase 7: same metadata strip as filterPostInputs.
     */
    $inputs = collect($inputs)->reject(fn($value, $key) => str_starts_with((string) $key, 'billing_') || str_starts_with((string) $key, 'shipping_'))->toArray();

    /**
     * if the password is not changed, no
     * need to hash it
     */
    $inputs = collect($inputs)->filter(fn($input) => ! empty($input) || $input === 0)->toArray();

    if (! empty($inputs['password'])) {
      $inputs['password'] = Hash::make($inputs['password']);
    }

    return collect($inputs)->map(function ($value, $key) {
      if ($key === 'group_id' && empty($value)) {
        $value = $this->options->get('sb_customers_default_group', false);
        $group = CustomerGroup::find($value);

        if (! $group instanceof CustomerGroup) {
          throw new NotAllowedException(__('The assigned default customer group doesn\'t exist or is not defined.'));
        }
      }

      return $value;
    })->toArray();
  }

  /**
   * Before creating a record
   *
   * Phase 7: mirrors `beforePut`/`CustomerCrud::beforePost` — the crud
   * `$permissions['create'] => 'create.users'` was never enforced on POST
   * before (the route stack is auth-only).
   */
  public function beforePost($inputs): void
  {
    $this->allowedTo('create');
  }

  /**
   * After saving a record
   *
   * @param  Request $request
   * @return void
   */
  public function afterPost($request, User $entry)
  {
    /**
     * Phase 7: persist the billing/shipping metadata (the $request here is
     * the raw flat payload — prefixed address keys included).
     */
    $this->saveAddressesMetadata($request, $entry);

    if (isset($request['roles'])) {
      $this->userService
        ->setUserRole(
          $entry,
          $request['roles']
        );

      $this->userService->createAttribute($entry);

      /**
       * While creating the user, if we set that user as active
       * we'll dispatch the activation successful event.
       */
      if ($entry->active) {
        UserAfterActivationSuccessfulEvent::dispatch($entry);
      }
    }

    return $request;
  }

  /**
   * get
   *
   * @param  string
   * @return mixed
   */
  public function get($param)
  {
    switch ($param) {
      case 'model':
        return $this->model;
        break;
    }
  }

  /**
   * Before updating a record
   *
   * @param Request $request
   * @param  object entry
   * @return void
   */
  public function beforePut($request, $entry)
  {
    $this->allowedTo('update');

    return $request;
  }

  /**
   * After updating a record
   *
   * @param Request $request
   * @param  object entry
   * @return void
   */
  public function afterPut($request, User $entry)
  {
    /**
     * Phase 7: persist the billing/shipping metadata (the $request here is
     * the raw flat payload — prefixed address keys included).
     */
    $this->saveAddressesMetadata($request, $entry);

    if (isset($request['roles'])) {
      $this->userService
        ->setUserRole(
          $entry,
          $request['roles']
        );

      $this->userService->createAttribute($entry);

      /**
       * While creating the user, if we set that user as active
       * we'll dispatch the activation successful event.
       */
      if ($entry->active) {
        UserAfterActivationSuccessfulEvent::dispatch($entry);
      }
    }

    return $request;
  }

  /**
   * Before Delete
   *
   * @return void
   */
  public function beforeDelete($namespace, int $id, $model)
  {
    if ($namespace == 'sb.users') {
      $this->allowedTo('delete');

      if ($id === Auth::id()) {
        throw new NotAllowedException(__('You cannot delete your own account.'));
      }
    }
  }

  /**
   * Define Columns
   */
  public function getColumns(): array
  {
    return CrudTable::columns(
      CrudTable::column(
        identifier: 'username',
        label: __('Username'),
        attributes: CrudTable::attributes(
          CrudTable::attribute(
            column: 'active',
            label: __('Active')
          ),
          CrudTable::attribute(
            column: 'email',
            label: __('Email')
          )
        )
      ),
      CrudTable::column(
        label: __('Wallet'),
        identifier: 'account_amount',
      ),
      CrudTable::column(
        label: __('Owed'),
        identifier: 'owed_amount'
      ),
      CrudTable::column(
        label: __('Purchases'),
        identifier: 'purchases_amount'
      ),
      CrudTable::column(
        label: __('Roles'),
        identifier: 'rolesNames',
        sort: false
      ),
      CrudTable::column(
        label: __('Created At'),
        identifier: 'created_at'
      )
    );
  }

  /**
   * Define actions
   */
  public function setActions(CrudEntry $entry): CrudEntry
  {
    $entry->action(
      identifier: 'edit_customers_group',
      label: __('Edit'),
      url: sb()->url('dashboard/users/edit/' . $entry->id),
    );

    /**
     * The four customer-scoped sub-list GOTOs (T5.3): their targets are
     * the `/dashboard/users/{user}/…` routes + backend-driven sub-list
     * pages built by T5.3 (routes/web/users.php + UsersController).
     */
    $entry->action(
      identifier: 'customers_orders',
      label: __('Orders'),
      url: sb()->url('dashboard/users/' . $entry->id . '/orders'),
    );

    $entry->action(
      identifier: 'customers_rewards',
      label: __('Rewards'),
      url: sb()->url('dashboard/users/' . $entry->id . '/rewards'),
    );

    $entry->action(
      identifier: 'customers_coupons',
      label: __('Coupons'),
      url: sb()->url('dashboard/users/' . $entry->id . '/coupons'),
    );

    $entry->action(
      identifier: 'customers_history',
      label: __('Wallet History'),
      url: sb()->url('dashboard/users/' . $entry->id . '/account-history'),
    );

    $entry->action(
      identifier: 'delete',
      label: __('Delete'),
      type: 'DELETE',
      url: sb()->url('/api/crud/sb.users/' . $entry->id),
      confirm: [
        'title' => __('Confirm Your Action'),
        'message' => __('Would you like to delete this ?'),
      ],
    );

    $roles = User::find($entry->id)->roles()->get();
    $entry->rolesNames = $roles->map(fn($role) => $role->name)->join(', ') ?: __('Not Assigned');

    return $entry;
  }

  /**
   * Bulk Delete Action
   *
   * @param    object Request with object
   * @return  false/array
   */
  public function bulkAction(Request $request)
  {
    /**
     * Deleting licence is only allowed for admin
     * and supervisor.
     */
    $user = app()->make(UsersService::class);
    if (! $user->is(['admin', 'supervisor'])) {
      return JsonResponse::error(
        message: __('You\'re not allowed to do this operation')
      );
    }

    if ($request->input('action') == 'delete_selected') {
      $status = [
        'success' => 0,
        'error' => 0,
      ];

      /**
       * @temp
       */
      if (Auth::user()->role->namespace !== 'admin') {
        throw new Exception(__('Access Denied'));
      }

      foreach ($request->input('entries') as $id) {
        $entity = $this->model::find($id);
        if ($entity instanceof User) {
          $entity->delete();
          $status['success']++;
        } else {
          $status['error']++;
        }
      }

      return $status;
    }

    return Hook::filter($this->namespace . '-catch-action', false, $request);
  }

  /**
   * get Links
   *
   * @return array of links
   */
  public function getLinks(): array
  {
    return [
      'list' => sb()->url('dashboard/' . 'users'),
      'create' => sb()->url('dashboard/' . 'users/create'),
      'edit' => sb()->url('dashboard/' . 'users/edit/'),
      'post' => sb()->url('api/crud/' . 'sb.users'),
      'put' => sb()->url('api/crud/' . 'sb.users/{id}' . ''),
    ];
  }

  /**
   * Get Bulk actions
   *
   * @return array of actions
   **/
  public function getBulkActions(): array
  {
    return Hook::filter($this->namespace . '-bulk', [
      [
        'label' => __('Delete Selected Groups'),
        'identifier' => 'delete_selected',
        'url' => sb()->route('sb.api.crud-bulk-actions', [
          'namespace' => $this->namespace,
        ]),
      ],
    ]);
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
