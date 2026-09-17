<?php

/**
 * Phase 7 (docs/plans/backend-driven-completion/07): the sb.users crud write
 * path persists the renamed billing/shipping tabs (`billing_*` /
 * `shipping_*`) as address metadata through the exact writer the generic
 * tabs-relation loop used (CrudService::saveTabRelation), while the core
 * users columns, the roles sync (UsersService::setUserRole — already
 * delegated to afterPost/afterPut), the group-default fallback
 * (filterPostInputs) and the users password semantics (hashed when
 * provided, untouched when omitted — no randomization, unlike customers)
 * keep their generic behaviors. The metadata is asserted via the
 * `User::billing`/`User::shipping` accessors the API returns, the unique
 * violations surface as 422 dot keys, the create permission is now
 * enforced (`beforePost`), and the backend-driven form shell is pinned for
 * both the create and the edit flow (the P7.2 one-liners).
 */

use App\Crud\UserCrud;
use App\Models\CustomerBillingAddress;
use App\Models\CustomerGroup;
use App\Models\CustomerShippingAddress;
use App\Models\Role;
use App\Models\User;
use App\Services\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Inertia\Response;
use Inertia\Support\Header;
use PHPUnit\Framework\TestCase;

/**
 * The ConfigForm payload contract — exactly what `buildCrudPayload` emits
 * for the renamed UserCrud tabs (main + nested `{general, billing,
 * shipping}` sections, empty strings included).
 */
function userWritePayload(array $overrides = []): array
{
    return array_merge([
        'username' => 'jane.doe',
        'general' => [
            'email' => 'jane.doe@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'phone' => '0601020304',
            'pobox' => '',
            'gender' => 'female',
            'active' => 1,
            'group_id' => '',
            'birth_date' => '1990-05-01 00:00:00',
            'credit_limit_amount' => 150,
            'password' => 'supersecret1',
            'password_confirm' => 'supersecret1',
            'roles' => [],
        ],
        'billing' => [
            'billing_first_name' => 'Billing Jane',
            'billing_last_name' => 'Doe',
            'billing_phone' => '0611223344',
            'billing_address_1' => '1 Billing Street',
            'billing_address_2' => '',
            'billing_country' => 'Wonderland',
            'billing_city' => 'Billing City',
            'billing_pobox' => '',
            'billing_company' => '',
            'billing_email' => '',
        ],
        'shipping' => [
            'shipping_first_name' => 'Shipping Jane',
            'shipping_last_name' => 'Doe',
            'shipping_phone' => '0622334455',
            'shipping_address_1' => '2 Shipping Avenue',
            'shipping_address_2' => '',
            'shipping_country' => 'Wonderland',
            'shipping_city' => 'Shipping City',
            'shipping_pobox' => '',
            'shipping_company' => '',
            'shipping_email' => '',
        ],
    ], $overrides);
}

function userWriteActor(TestCase $case): User
{
    Gate::before(fn () => true);

    $user = User::factory()->create();
    $case->actingAs($user);

    return $user;
}

/**
 * `Inertia\Response` exposes no `toArray()`; the wire payload is what
 * `toResponse()` emits as a `JsonResponse` when the `X-Inertia` header is
 * set (same helper as CrudFormRenderTest, locally scoped).
 */
function userWireShape(Response $response, string $uri): array
{
    $request = Request::create($uri, 'GET');
    $request->headers->set(Header::INERTIA, 'true');

    return $response->toResponse($request)->getData(true);
}


it('creates a user with its billing/shipping metadata and the submitted roles through the crud endpoint', function () {
    userWriteActor($this);
    $group = CustomerGroup::factory()->create();
    $roleIds = Role::whereIn('namespace', [Role::ADMIN, Role::STOREADMIN])->pluck('id')->all();

    $payload = userWritePayload([
        'general' => [
            'email' => 'jane.doe@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'phone' => '0601020304',
            'pobox' => '',
            'gender' => 'female',
            'active' => 1,
            'group_id' => $group->id,
            'birth_date' => '1990-05-01 00:00:00',
            'credit_limit_amount' => 150,
            'password' => 'supersecret1',
            'password_confirm' => 'supersecret1',
            'roles' => $roleIds,
        ],
    ]);

    $response = $this->postJson('/api/crud/sb.users', $payload);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $userId = $response->json('entry.id');
    expect($userId)->toBeInt();

    // core users columns from the general tab (birth_date round-trips since
    // it joined the crud fillable in Phase 7)
    $user = User::findOrFail($userId);
    expect($user->username)->toBe('jane.doe');
    expect($user->email)->toBe('jane.doe@example.com');
    expect($user->first_name)->toBe('Jane');
    expect($user->last_name)->toBe('Doe');
    expect($user->phone)->toBe('0601020304');
    expect($user->group_id)->toBe($group->id);
    expect($user->active)->toBeTrue();
    expect($user->birth_date->format('Y-m-d'))->toBe('1990-05-01');

    // password handled per the users semantics: hashed when provided
    expect(Hash::check('supersecret1', $user->password))->toBeTrue();

    // billing/shipping metadata via the accessors the API returns. The
    // prefixed tab keys win; the general-tab bare fields only seed the
    // address rows where the prefixed form left them empty (the same
    // Phase 6 fallback semantics — billing_email is cleared in the payload).
    $loaded = User::with(['billing', 'shipping'])->findOrFail($userId);
    expect($loaded->billing?->first_name)->toBe('Billing Jane');
    expect($loaded->billing?->phone)->toBe('0611223344');
    expect($loaded->billing?->address_1)->toBe('1 Billing Street');
    expect($loaded->billing?->country)->toBe('Wonderland');
    expect($loaded->billing?->city)->toBe('Billing City');
    expect($loaded->shipping?->first_name)->toBe('Shipping Jane');
    expect($loaded->shipping?->address_1)->toBe('2 Shipping Avenue');
    expect($loaded->shipping?->city)->toBe('Shipping City');

    // one typed row per address type, author stamped by the writer
    expect(CustomerBillingAddress::where('customer_id', $userId)->count())->toBe(1);
    expect(CustomerShippingAddress::where('customer_id', $userId)->count())->toBe(1);
    expect(CustomerBillingAddress::where('customer_id', $userId)->value('author'))->toBe(auth()->id());

    // roles persisted through the existing afterPost delegation
    $roleRelations = DB::table('subul_users_roles_relations')->where('user_id', $userId)->pluck('role_id');
    expect($roleRelations)->toHaveCount(count($roleIds));
    foreach ($roleIds as $roleId) {
        expect($roleRelations->contains($roleId))->toBeTrue();
    }
});

it('falls back to the default customer group option when group_id is 0', function () {
    userWriteActor($this);
    $group = CustomerGroup::factory()->create();

    app(Options::class)->set('sb_customers_default_group', $group->id);

    $payload = userWritePayload();
    $payload['general']['group_id'] = 0;

    $response = $this->postJson('/api/crud/sb.users', $payload);

    $response->assertStatus(200);

    expect(User::findOrFail($response->json('entry.id'))->group_id)->toBe($group->id);
});

it('rejects a taken email and username with the form dot keys', function () {
    userWriteActor($this);

    $first = $this->postJson('/api/crud/sb.users', userWritePayload());
    $first->assertStatus(200);

    // same email, different username → the general-tab unique rule
    $second = $this->postJson('/api/crud/sb.users', userWritePayload([
        'username' => 'john.doe',
    ]));
    $second->assertStatus(422);
    expect($second->json('errors'))->toHaveKey('general.email');

    // same username → the main-field unique rule
    $third = $this->postJson('/api/crud/sb.users', userWritePayload([
        'general' => [
            'email' => 'john.doe@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '0601020304',
            'pobox' => '',
            'gender' => 'male',
            'active' => 1,
            'group_id' => '',
            'birth_date' => '',
            'credit_limit_amount' => 0,
            'password' => 'supersecret1',
            'password_confirm' => 'supersecret1',
            'roles' => [],
        ],
    ]));
    $third->assertStatus(422);
    expect($third->json('errors'))->toHaveKey('username');
});

it('updates a user through the crud endpoint, round-trips the metadata on the same rows and syncs roles', function () {
    userWriteActor($this);
    $group = CustomerGroup::factory()->create();
    $firstRoleId = Role::where('namespace', Role::ADMIN)->firstOrFail()->id;
    $secondRoleId = Role::where('namespace', Role::STOREADMIN)->firstOrFail()->id;

    $payload = userWritePayload();
    $payload['general']['group_id'] = $group->id;
    $payload['general']['roles'] = [$firstRoleId];
    $userId = $this->postJson('/api/crud/sb.users', $payload)->json('entry.id');

    $before = User::with(['billing', 'shipping'])->findOrFail($userId);
    $billingRowId = $before->billing->id;
    $shippingRowId = $before->shipping->id;

    $update = userWritePayload([
        'general' => [
            'email' => 'jane.doe.updated@example.com',
            'first_name' => 'Janet',
            'last_name' => 'Doe',
            'phone' => '0601020304',
            'pobox' => '',
            'gender' => 'female',
            'active' => 1,
            'group_id' => $group->id,
            'birth_date' => '',
            'credit_limit_amount' => 150,
            'password' => 'freshpassword1',
            'password_confirm' => 'freshpassword1',
            'roles' => [$secondRoleId],
        ],
        'billing' => [
            'billing_first_name' => 'Billing Janet',
            'billing_last_name' => 'Doe',
            'billing_phone' => '0699887766',
            'billing_address_1' => '9 New Billing Street',
            'billing_address_2' => '',
            'billing_country' => 'Wonderland',
            'billing_city' => 'New Billing City',
            'billing_pobox' => '',
            'billing_company' => '',
            'billing_email' => '',
        ],
        'shipping' => [
            'shipping_first_name' => 'Shipping Janet',
            'shipping_last_name' => 'Doe',
            'shipping_phone' => '',
            'shipping_address_1' => '8 New Shipping Avenue',
            'shipping_address_2' => '',
            'shipping_country' => 'Wonderland',
            'shipping_city' => '',
            'shipping_pobox' => '',
            'shipping_company' => '',
            'shipping_email' => '',
        ],
    ]);

    $response = $this->putJson('/api/crud/sb.users/'.$userId, $update);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $user = User::with(['billing', 'shipping'])->findOrFail($userId);
    expect($user->first_name)->toBe('Janet');
    expect($user->email)->toBe('jane.doe.updated@example.com');

    // password change honored
    expect(Hash::check('freshpassword1', $user->password))->toBeTrue();

    // same rows updated, not duplicated
    expect($user->billing->id)->toBe($billingRowId);
    expect($user->shipping->id)->toBe($shippingRowId);
    expect(CustomerBillingAddress::where('customer_id', $userId)->count())->toBe(1);
    expect(CustomerShippingAddress::where('customer_id', $userId)->count())->toBe(1);

    expect($user->billing->first_name)->toBe('Billing Janet');
    expect($user->billing->phone)->toBe('0699887766');
    expect($user->billing->address_1)->toBe('9 New Billing Street');
    expect($user->shipping->first_name)->toBe('Shipping Janet');
    expect($user->shipping->address_1)->toBe('8 New Shipping Avenue');

    // roles synced: the old relation is gone, the new one persisted
    $roleRelations = DB::table('subul_users_roles_relations')->where('user_id', $userId)->pluck('role_id')->values()->all();
    expect($roleRelations)->toBe([$secondRoleId]);
});


it('leaves the password untouched when the update omits it', function () {
    userWriteActor($this);
    $group = CustomerGroup::factory()->create();
    $roleId = Role::where('namespace', Role::ADMIN)->firstOrFail()->id;

    $payload = userWritePayload();
    $payload['general']['group_id'] = $group->id;
    $payload['general']['roles'] = [$roleId];
    $userId = $this->postJson('/api/crud/sb.users', $payload)->json('entry.id');
    $originalHash = User::findOrFail($userId)->password;

    // the ConfigForm submits the password fields empty on edit — getFlatForm
    // drops the empty strings, so the PUT carries no password keys at all
    $update = userWritePayload([
        'general' => [
            'email' => 'jane.doe@example.com',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'phone' => '0601020304',
            'pobox' => '',
            'gender' => 'female',
            'active' => 1,
            'group_id' => $group->id,
            'birth_date' => '',
            'credit_limit_amount' => 150,
            'roles' => [$roleId],
        ],
    ]);

    $response = $this->putJson('/api/crud/sb.users/'.$userId, $update);

    $response->assertStatus(200);
    expect(User::findOrFail($userId)->password)->toBe($originalHash);
});

it('rejects a create without the create.users permission', function () {
    // no Gate::before bypass: a plain authenticated user holds no permission
    User::factory()->create();
    $this->actingAs(User::factory()->create());

    $response = $this->postJson('/api/crud/sb.users', userWritePayload());

    $response->assertStatus(403);
});


it('rejects mismatched password confirmation on the general.password_confirm dot key', function () {
    // parity pin: the hand payload sent `password_confirmation` (a key the
    // extracted rules never validated), so the `same:general.password` rule
    // never fired server-side; the ConfigForm submits the real
    // `password_confirm` field and the inline error now surfaces.
    userWriteActor($this);

    $payload = userWritePayload();
    $payload['general']['password_confirm'] = 'different1';

    $response = $this->postJson('/api/crud/sb.users', $payload);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('general.password_confirm');
});


it('renders the backend-driven user form with the renamed tabs seeded from the metadata', function () {
    userWriteActor($this);

    $createShape = userWireShape(UserCrud::form(), '/dashboard/users/create');
    expect($createShape['component'])->toBe('crud/form');
    expect($createShape['props']['namespace'])->toBe('sb.users');

    $config = $createShape['props']['initialConfig'];
    $billingFields = collect($config['form']['tabs']['billing']['fields'])->pluck('name')->all();
    expect($billingFields)->toContain('billing_first_name', 'billing_email');
    expect($config['form']['tabs']['shipping']['fields'][0]['name'])->toBe('shipping_first_name');

    $user = User::factory()->create();
    CustomerBillingAddress::factory()->create([
        'customer_id' => $user->id,
        'first_name' => 'Meta Jane',
    ]);

    $editShape = userWireShape(UserCrud::form($user), '/dashboard/users/edit/'.$user->id);
    $editConfig = $editShape['props']['initialConfig'];

    expect($editShape['props']['id'])->toBe($user->id);
    expect($editConfig['submitMethod'])->toBe('put');

    $billingFirstName = collect($editConfig['form']['tabs']['billing']['fields'])->firstWhere('name', 'billing_first_name');
    expect($billingFirstName['value'])->toBe('Meta Jane');
});

