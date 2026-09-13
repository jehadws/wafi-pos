<?php

/**
 * Subul Controller
 *
 * @since  1.0
 **/

namespace App\Http\Controllers\Dashboard;

use App\Crud\RolesCrud;
use App\Crud\UserCrud;
use App\Http\Controllers\DashboardController;
use App\Models\CustomerAddress;
use App\Models\CustomerGroup;
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
    $users = User::with(['roles'])->get();
    return Inertia::render('dashboard/users/page', [
      'title' => __('Permission Manager'),
      'users' => $users,
    ]);
    return UserCrud::table();
  }

  public function createUser()
  {
    sb()->restrict(['create.users']);
    $roles = Role::get(['id', 'name']);
    $groups = CustomerGroup::get(['id', 'name']);
    return Inertia::render('dashboard/users/create', [
      'title' => __('Permission Manager'),
      'groups' => $groups,
      'roles' => $roles
    ]);

    // return UserCrud::form();
  }

  public function editUser(User $user)
  {
    sb()->restrict(['update.users']);
    $roles = Role::get(['id', 'name']);
    $groups = CustomerGroup::get(['id', 'name']);
    $user->roles;
    $billing = CustomerAddress::where('customer_id', $user->id)->where('type', 'billing')->first();
    $shipping = CustomerAddress::where('customer_id', $user->id)->where('type', 'shipping')->first();
    $user->billing = $billing;
    $user->shipping = $shipping;

    if ($user->id === Auth::id()) {
      return redirect(sb()->route('sb.dashboard.users.profile'));
    }

    return Inertia::render('dashboard/users/edit', [
      'title' => __('Permission Manager'),
      'groups' => $groups,
      'roles' => $roles,
      'user' => $user
    ]);

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
    return Inertia::render('dashboard/users/roles/edit', [
      'title' => __('Edit Role'),
      'role' => $role
    ]);

    // return RolesCrud::form($role);
  }

  public function createRole(Role $role)
  {
    return Inertia::render('dashboard/users/roles/create', [
      'title' => __('Create Role'),
    ]);
    // return RolesCrud::form();
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
