<?php

/**
 * Phase 2 gate (backend-driven-leftovers): `CrudService::form()` must render
 * the generic `crud/form` Inertia shell with the full form config travelling
 * as `initialConfig` — one case for each of the create and edit flows.
 *
 * No controller consumes this yet (Phase 3 does the sweep): the migrated
 * pages still fetch their config client-side.
 */

use App\Crud\ProductCategoryCrud;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\UsersService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Response;
use Inertia\Support\Header;

/**
 * Factory users carry no `UserAttribute` row (production creates it at
 * user-creation time via `UsersService::createAttribute()`). DateService
 * reads `Auth::user()->attribute->language` unguarded, and any timestamped
 * SbRootModel save (e.g. the edit test's `ProductCategory::factory()->create()`)
 * goes through `freshTimestamp()` → `sb()->date->getNow()` → that unguarded
 * read — a known production bug scheduled for Phase 6. Seed the attribute row
 * here so this suite pins the form render, not that unrelated crash.
 */
function crudFormTestUser(): User
{
    $user = User::factory()->create();
    app(UsersService::class)->createAttribute($user);
    /**
     * createAttribute() read `$user->attribute` for its guard, which lazily
     * loaded — and cached — a null relation before the row was inserted.
     * Auth::user() returns this same instance, so re-load the relation to
     * surface the freshly saved row.
     */
    $user->load('attribute');

    return $user;
}

/**
 * `Inertia\Response` exposes no `toArray()`; the wire payload (`component`,
 * `props`, `url`, `version`, …) is what `toResponse()` emits as a
 * `JsonResponse` when the `X-Inertia` header is set — decode that to the
 * array Inertia ships to the SPA.
 */
function crudFormWireShape(Response $response, string $uri): array
{
    $request = Request::create($uri, 'GET');
    $request->headers->set(Header::INERTIA, 'true');

    return $response->toResponse($request)->getData(true);
}

it('renders crud/form through Inertia for create flows', function () {
    Gate::before(fn () => true);
    $this->actingAs(crudFormTestUser());

    $response = ProductCategoryCrud::form();

    expect($response)->toBeInstanceOf(Response::class);

    $inertia = crudFormWireShape($response, '/dashboard/products/categories/create');

    expect($inertia['component'])->toBe('crud/form');
    expect($inertia['props']['namespace'])->toBe('sb.products-categories');

    $config = $inertia['props']['initialConfig'];
    expect($config['namespace'])->toBe('sb.products-categories');
    expect($config['submitMethod'])->toBe('post');
    expect(array_key_exists('form', $config))->toBeTrue();
    expect(array_key_exists('labels', $config))->toBeTrue();
    expect(array_key_exists('links', $config))->toBeTrue();
    expect(array_key_exists('optionAttributes', $config))->toBeTrue();

    // title/description pass through the create fallbacks computed inside getFormConfig()
    expect($inertia['props']['title'])->toBe($config['title']);
    expect($inertia['props']['description'])->toBe($config['description']);
    expect($inertia['props']['description'])->toBe($config['labels']['create_description']);

    // default breadcrumb: list title → SPA path of the list link
    expect($inertia['props']['breadcrumbs'][0]['title'])->toBe($config['labels']['list_title']);
    expect(str_ends_with($inertia['props']['breadcrumbs'][0]['href'], '/dashboard/products/categories'))->toBeTrue();
});

it('renders crud/form through Inertia for edit flows', function () {
    Gate::before(fn () => true);
    $this->actingAs(crudFormTestUser());

    $entry = ProductCategory::factory()->create();

    $response = ProductCategoryCrud::form(entry: $entry);

    expect($response)->toBeInstanceOf(Response::class);

    $inertia = crudFormWireShape($response, '/dashboard/products/categories/edit/' . $entry->id);

    expect($inertia['component'])->toBe('crud/form');
    expect($inertia['props']['namespace'])->toBe('sb.products-categories');

    $config = $inertia['props']['initialConfig'];
    expect($config['submitMethod'])->toBe('put');
    expect(str_contains($config['submitUrl'], (string) $entry->id))->toBeTrue();
    expect(array_key_exists('form', $config))->toBeTrue();
    expect(array_key_exists('labels', $config))->toBeTrue();
    expect(array_key_exists('links', $config))->toBeTrue();

    // title/description pass through the edit fallbacks computed inside getFormConfig()
    expect($inertia['props']['title'])->toBe($config['title']);
    expect($inertia['props']['description'])->toBe($config['labels']['edit_description']);
});
