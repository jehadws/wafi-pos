<?php

/**
 * Phase 6 (docs/plans/backend-driven-completion/06): the sb.customers crud
 * write path persists the renamed billing/shipping tabs (`billing_*` /
 * `shipping_*`) as address metadata through the exact writer the generic
 * tabs-relation loop uses (CrudService::saveTabRelation), while the core
 * users columns, the group-default fallback (filterPostInputs) and the
 * STORECUSTOMER role assign keep their generic behaviors. The metadata is
 * asserted via the `Customer::billing`/`Customer::shipping` accessors the
 * API returns, and the backend-driven form shell is pinned for both the
 * create and the edit flow (the P6.3 one-liners).
 */

use App\Crud\CustomerCrud;
use App\Models\Customer;
use App\Models\CustomerBillingAddress;
use App\Models\CustomerGroup;
use App\Models\CustomerShippingAddress;
use App\Models\Role;
use App\Models\User;
use App\Services\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Response;
use Inertia\Support\Header;
use PHPUnit\Framework\TestCase;

/**
 * The ConfigForm payload contract — exactly what `buildCrudPayload` emits
 * for the renamed CustomerCrud tabs (main + nested `{general, billing,
 * shipping}` sections, empty strings included).
 */
function customerWritePayload(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'John',
        'general' => [
            'last_name' => 'Doe',
            'credit_limit_amount' => 100,
            'group_id' => '',
            'birth_date' => '',
            'email' => 'john.doe@example.com',
            'phone' => '0601020304',
            'pobox' => '',
            'gender' => 'male',
        ],
        'billing' => [
            'billing_first_name' => 'Billing John',
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
            'shipping_first_name' => 'Shipping John',
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

function customerWriteActor(TestCase $case): User
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
function customerWireShape(Response $response, string $uri): array
{
    $request = Request::create($uri, 'GET');
    $request->headers->set(Header::INERTIA, 'true');

    return $response->toResponse($request)->getData(true);
}

it('creates a customer with its billing/shipping metadata and the store-customer role through the crud endpoint', function () {
    $actor = customerWriteActor($this);
    $group = CustomerGroup::factory()->create();

    $payload = customerWritePayload();
    $payload['general']['group_id'] = $group->id;

    $response = $this->postJson('/api/crud/sb.customers', $payload);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $customerId = $response->json('entry.id');
    expect($customerId)->toBeInt();

    // core users columns from the general tab
    $customer = Customer::findOrFail($customerId);
    expect($customer->first_name)->toBe('John');
    expect($customer->last_name)->toBe('Doe');
    expect($customer->phone)->toBe('0601020304');
    expect($customer->email)->toBe('john.doe@example.com');
    expect($customer->group_id)->toBe($group->id);

    // billing/shipping metadata via the accessors the API returns
    $loaded = Customer::with(['billing', 'shipping'])->findOrFail($customerId);
    expect($loaded->billing?->first_name)->toBe('Billing John');
    expect($loaded->billing?->phone)->toBe('0611223344');
    expect($loaded->billing?->address_1)->toBe('1 Billing Street');
    expect($loaded->billing?->country)->toBe('Wonderland');
    expect($loaded->shipping?->first_name)->toBe('Shipping John');
    expect($loaded->shipping?->address_1)->toBe('2 Shipping Avenue');
    expect($loaded->shipping?->city)->toBe('Shipping City');

    // one typed row per address type
    expect(CustomerBillingAddress::where('customer_id', $customerId)->count())->toBe(1);
    expect(CustomerShippingAddress::where('customer_id', $customerId)->count())->toBe(1);

    // role assign still fires on create
    $role = Role::where('namespace', Role::STORECUSTOMER)->firstOrFail();
    expect(DB::table('subul_users_roles_relations')
        ->where('user_id', $customerId)
        ->where('role_id', $role->id)
        ->exists())->toBeTrue();

    // author stamped by the writer
    expect(CustomerBillingAddress::where('customer_id', $customerId)->value('author'))->toBe($actor->id);
});

it('falls back to the default customer group option when group_id is 0', function () {
    customerWriteActor($this);
    $group = CustomerGroup::factory()->create();

    app(Options::class)->set('sb_customers_default_group', $group->id);

    $payload = customerWritePayload();
    $payload['general']['group_id'] = 0;

    $response = $this->postJson('/api/crud/sb.customers', $payload);

    $response->assertStatus(200);

    expect(Customer::findOrFail($response->json('entry.id'))->group_id)->toBe($group->id);
});

it('rejects an empty group_id with a general.group_id 422 key', function () {
    customerWriteActor($this);
    CustomerGroup::factory()->create();

    $payload = customerWritePayload();
    $payload['general']['group_id'] = '';

    $response = $this->postJson('/api/crud/sb.customers', $payload);

    $response->assertStatus(422);
    expect($response->json('errors'))->toHaveKey('general.group_id');
});

it('updates a customer through the crud endpoint and round-trips the metadata on the same rows', function () {
    customerWriteActor($this);
    $group = CustomerGroup::factory()->create();

    $payload = customerWritePayload();
    $payload['general']['group_id'] = $group->id;

    $customerId = $this->postJson('/api/crud/sb.customers', $payload)->json('entry.id');

    $before = Customer::with(['billing', 'shipping'])->findOrFail($customerId);
    $billingRowId = $before->billing->id;
    $shippingRowId = $before->shipping->id;

    $update = customerWritePayload([
        'first_name' => 'Jane',
        'general' => [
            'last_name' => 'Doe',
            'credit_limit_amount' => 100,
            'group_id' => $group->id,
            'birth_date' => '',
            'email' => 'jane.doe@example.com',
            'phone' => '0601020304',
            'pobox' => '',
            'gender' => 'male',
        ],
        'billing' => [
            'billing_first_name' => 'Billing Jane',
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
            'shipping_first_name' => 'Shipping Jane',
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

    $response = $this->putJson('/api/crud/sb.customers/'.$customerId, $update);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $customer = Customer::with(['billing', 'shipping'])->findOrFail($customerId);
    expect($customer->first_name)->toBe('Jane');

    // same rows updated, not duplicated
    expect($customer->billing->id)->toBe($billingRowId);
    expect($customer->shipping->id)->toBe($shippingRowId);
    expect(CustomerBillingAddress::where('customer_id', $customerId)->count())->toBe(1);
    expect(CustomerShippingAddress::where('customer_id', $customerId)->count())->toBe(1);

    expect($customer->billing->first_name)->toBe('Billing Jane');
    expect($customer->billing->phone)->toBe('0699887766');
    expect($customer->billing->address_1)->toBe('9 New Billing Street');
    expect($customer->shipping->first_name)->toBe('Shipping Jane');
    expect($customer->shipping->address_1)->toBe('8 New Shipping Avenue');
});

it('creates a customer whose email was left empty (the payload drops empty keys, so the key is missing entirely)', function () {
    customerWriteActor($this);
    $group = CustomerGroup::factory()->create();

    $payload = customerWritePayload();
    $payload['general']['email'] = '';
    $payload['general']['group_id'] = $group->id;

    $response = $this->postJson('/api/crud/sb.customers', $payload);

    // Regression: precheckCustomers used to read $fields['email'] directly,
    // crashing with "Undefined array key \"email\"" once getFlatForm dropped
    // the empty value. The write must succeed and filterPostInputs falls
    // back to a generated customer-{id}@host email.
    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');

    $customer = Customer::findOrFail($response->json('entry.id'));
    expect($customer->email)->toMatch('/^customer-\d+@/');
});

it('updates a customer whose email key is omitted from the payload', function () {
    customerWriteActor($this);
    $group = CustomerGroup::factory()->create();

    $payload = customerWritePayload();
    $payload['general']['group_id'] = $group->id;

    $customerId = $this->postJson('/api/crud/sb.customers', $payload)->json('entry.id');

    // The ConfigForm/backend contract: empty values are dropped by
    // SbForms::getFlatForm, so a blank email never reaches beforePut —
    // the key is absent, not an empty string.
    $update = customerWritePayload(['first_name' => 'Jane']);
    $update['general']['group_id'] = $group->id;
    unset($update['general']['email']);

    $response = $this->putJson('/api/crud/sb.customers/'.$customerId, $update);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe('success');
    // the omitted email must not wipe or corrupt the stored one
    expect(Customer::findOrFail($customerId)->email)->toBe('john.doe@example.com');
});

it('renders the backend-driven customer form with the renamed tabs seeded from the metadata', function () {
    customerWriteActor($this);

    $createShape = customerWireShape(CustomerCrud::form(), '/dashboard/customers/create');
    expect($createShape['component'])->toBe('crud/form');
    expect($createShape['props']['namespace'])->toBe('sb.customers');

    $config = $createShape['props']['initialConfig'];
    $billingFields = collect($config['form']['tabs']['billing']['fields'])->pluck('name')->all();
    expect($billingFields)->toContain('billing_first_name', 'billing_email');
    expect($config['form']['tabs']['shipping']['fields'][0]['name'])->toBe('shipping_first_name');

    $group = CustomerGroup::factory()->create();
    $customer = Customer::factory()->create(['group_id' => $group->id]);
    CustomerBillingAddress::factory()->create([
        'customer_id' => $customer->id,
        'first_name' => 'Meta John',
    ]);

    $editShape = customerWireShape(CustomerCrud::form($customer), '/dashboard/customers/edit/'.$customer->id);
    $editConfig = $editShape['props']['initialConfig'];

    expect($editShape['props']['id'])->toBe($customer->id);
    expect($editConfig['submitMethod'])->toBe('put');

    $billingFirstName = collect($editConfig['form']['tabs']['billing']['fields'])->firstWhere('name', 'billing_first_name');
    expect($billingFirstName['value'])->toBe('Meta John');
});
