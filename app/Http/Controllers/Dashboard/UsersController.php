<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Crud\CustomerAccountCrud;
use App\Crud\CustomerCouponCrud;
use App\Crud\CustomerOrderCrud;
use App\Crud\CustomerRewardCrud;
use App\Crud\RolesCrud;
use App\Crud\UserCrud;
use App\Http\Controllers\DashboardController;
use App\Models\CustomerAddress;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserAttribute;
use App\Services\DateService;
use App\Services\UsersService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;

class UsersController extends DashboardController
{
  public function __construct(
    protected UsersService $usersService,
    protected DateService $dateService
  ) {
    // ...
  }

  public function listUsers()
  {
    /**
     * The single backend-driven list shell (T4.5): the users table renders
     * from `UserCrud::table()` — Edit + Delete render from `$actions` and,
     * since T5.3, the four sub-list GOTOs (Orders, Rewards, Coupons,
     * Wallet History) too — their targets are the T5.3 routes below.
     * `table()` enforces `allowedTo('read')` internally.
     */
    return UserCrud::table();
  }

  /**
   * Displays the orders placed by a specific user.
   *
   * T5.3: users are rows of `subul_users` (the same table the customer
   * domain lists), so the sub-lists reuse the customer-domain CRUDs
   * scoped by `customer_id = user->id` — the exact targets the
   * `UserCrud` sub-list GOTOs point at.
   */
  public function getUserOrders(User $user)
  {
    return CustomerOrderCrud::table([
      'title' => sprintf(__('Orders by "%s"'), $user->username),
      'queryParams' => [
        'customer_id' => $user->id,
      ],
    ]);
  }

  /**
   * Displays the rewards earned by a specific user.
   */
  public function getUserRewards(User $user)
  {
    return CustomerRewardCrud::table([
      'title' => sprintf(__('Rewards by "%s"'), $user->username),
      'queryParams' => [
        'customer_id' => $user->id,
      ],
    ]);
  }

  /**
   * Displays the coupons claimed by a specific user.
   */
  public function getUserCoupons(User $user)
  {
    return CustomerCouponCrud::table([
      'title' => sprintf(__('Coupons by "%s"'), $user->username),
      'queryParams' => [
        'customer_id' => $user->id,
      ],
    ]);
  }

  /**
   * Displays the wallet history of a specific user.
   */
  public function getUserAccountHistory(User $user)
  {
    return CustomerAccountCrud::table([
      'title' => sprintf(__('Account History : %s'), $user->username),
      'queryParams' => [
        'customer_id' => $user->id,
      ],
    ]);
  }

  public function createUser()
  {
    /**
     * The backend-driven form shell (Phase 7,
     * docs/plans/backend-driven-completion/07): the user create form
     * renders from `UserCrud::form()` — the renamed billing/shipping tabs
     * replace the hand pages. `form()` enforces the permission internally
     * and the crud write path re-checks `create.users` in beforePost.
     */
    return UserCrud::form();
  }

  public function editUser(User $user)
  {
    /**
     * Editing your own account still goes to the profile page (the profile
     * is the separate sb.user-profile form surface).
     */
    if ($user->id === Auth::id()) {
      return redirect(sb()->route('sb.dashboard.users.profile'));
    }

    /**
     * The backend-driven form shell (Phase 7,
     * docs/plans/backend-driven-completion/07): the user edit form renders
     * from `UserCrud::form($user)` — the billing/shipping tabs seed from
     * the `User::billing`/`User::shipping` metadata accessors. `form()`
     * enforces the update permission internally.
     */
    return UserCrud::form($user);
  }

  public function getUsers(User $user)
  {
    sb()->restrict(['read.users']);

    return User::get(['username', 'id', 'email']);
  }

  /**
   * displays the permission manager UI
   *
   * @return View
   */
  public function permissionManager()
  {
    /**
     * force permissions check
     */
    sb()->restrict(['update.roles']);
    $roles = Role::with('permissions')->get();
    $permissions = Permission::get();

    return Inertia::render('dashboard/users/roles/permissions-manager', [
      'title' => __('Permission Manager'),
      'description' => __('Manage all permissions and roles'),
      'permissions' => $permissions,
      'roles' => $roles,
    ]);
  }

  /**
   * displays the user profile
   *
   * @return view
   */
  public function getProfile()
  {
    sb()->restrict(['manage.profile']);

    $attributes = UserAttribute::where('user_id', auth::user()->id)
      ->firstornew([
        'user_id' => auth::id(),
      ]);

    $currentBilling = CustomerAddress::from(Auth::id(), 'billing')->firstOrNew();
    $currentShipping = CustomerAddress::from(Auth::id(), 'shipping')->firstOrNew();

    return Inertia::render('dashboard/users/profile', [
      'title' => __('My Profile'),
      'description' => __('Change your personal settings'),
      'src' => url('/api/forms/sb.user-profile'),
      'submitUrl' => url('/api/users/profile'),
      'attributes' => $attributes,
      'currentBilling' => $currentBilling,
      'currentShipping' => $currentShipping,
      'tokens' => Inertia::optional(fn() => $this->getTokens()),
    ]);
  }

  /**
   * returns a list of existing roles
   *
   * @return array roles with permissions
   */
  public function getRoles()
  {
    return Role::with('permissions')->get();
  }

  /**
   * Returns a list of permissions
   *
   * @return array permissions
   */
  public function getPermissions()
  {
    return Permission::get();
  }

  /**
   * update roles permissions
   *
   * @return Json
   */
  public function updateRole(Request $request)
  {
    sb()->restrict(['update.roles']);

    $roles = $request->all();

    foreach ($roles as $roleNamespace => $permissions) {
      $role = Role::namespace($roleNamespace);

      if ($role instanceof Role) {
        $removedPermissions = collect($permissions)->filter(fn($permission) => ! $permission);
        $grantedPermissions = collect($permissions)->filter(fn($permission) => $permission);

        $role->removePermissions($removedPermissions->keys());
        $role->addPermissions($grantedPermissions->keys());
      }
    }

    return [
      'status' => 'success',
      'message' => __('The permissions has been updated.'),
    ];
  }

  /**
   * List all available roles
   *
   * @return \Inertia\Response
   */
  public function rolesList()
  {
    /**
     * The single backend-driven list shell (T3.1): the roles table renders
     * from `RolesCrud::table()` — columns, actions, bulk actions and links
     * come from the CRUD config. `table()` enforces `allowedTo('read')`
     * (`read.roles`) internally.
     */
    return RolesCrud::table();
  }

  /**
   * List all available roles
   *
   * @return View
   */
  public function editRole(Role $role)
  {
    sb()->restrict(['update.roles']);

    /**
     * The single backend-driven form shell (Phase 3): the role edit form
     * renders from `RolesCrud::form()`, pre-filled from the route-bound
     * role.
     */
    return RolesCrud::form($role);
  }

  public function createRole()
  {
    /**
     * The single backend-driven form shell (Phase 3): the role create form
     * renders from `RolesCrud::form()`. (The dead `Role $role` binding is
     * gone — the create route carries no `{role}` segment.)
     */
    return RolesCrud::form();
  }

  public function cloneRole(Role $role)
  {
    sb()->restrict(['create.roles']);

    return $this->usersService->cloneRole($role);
  }

  public function configureWidgets(Request $request)
  {
    return $this->usersService->storeWidgetsOnAreas($request->only(['column']));
  }

  public function createToken(Request $request)
  {
    $validation = Validator::make($request->all(), [
      'name' => 'required',
    ]);

    if (! $validation->passes()) {
      throw new Exception(__('The provided data aren\'t valid'));
    }

    return $this->usersService->createToken($request->input('name'));
  }

  public function getTokens()
  {
    return $this->usersService->getTokens();
  }

  public function deleteToken($tokenId)
  {
    return $this->usersService->deleteToken($tokenId);
  }

  public function checkPermission(Request $request)
  {
    $result = $this->usersService->checkPermission($request->input('permission'));

    if ($result) {
      return response()->json([
        'status' => 'success',
        'message' => __('The permission is granted'),
      ]);
    } else {
      return response()->json([
        'status' => 'error',
        'message' => __('The permission is denied'),
      ], 403);
    }
  }
}
