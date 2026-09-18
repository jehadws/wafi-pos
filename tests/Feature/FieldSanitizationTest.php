<?php

use App\Models\ProductCategory;
use App\Models\User;
use App\Services\Options;
use Illuminate\Support\Facades\Gate;

function fieldSanitizationTestUser(): User
{
    return User::factory()->create();
}

/**
 * Contract: `CrudService::submitRequest` / `Options::sanitizeValue`
 * blanket-strip every field that doesn't opt in, while fields that
 * declare `allowedTags` on their definition keep those tags only.
 * The `! empty($value)` guard semantics are pinned by
 * CrudValidationErrorsContractTest and stay untouched here.
 */
it('keeps the allowlisted tags on a rich-text category description and strips the rest', function () {
    Gate::before(fn () => true);
    $this->actingAs(fieldSanitizationTestUser());

    $response = $this->postJson('/api/crud/sb.products-categories', [
        'name' => 'Rich Category',
        'general' => [
            'displays_on_pos' => 1,
            'description' => '<p><b>hi</b></p><script>alert(1)</script>',
        ],
    ]);

    $response->assertStatus(200);

    $category = ProductCategory::where('name', 'Rich Category')->first();

    expect($category)->not->toBeNull();
    expect($category->description)->toBe('<p><b>hi</b></p>alert(1)');
});

it('still strips every tag from fields that do not opt in to an allowlist', function () {
    Gate::before(fn () => true);
    $this->actingAs(fieldSanitizationTestUser());

    $response = $this->postJson('/api/crud/sb.products-categories', [
        'name' => '<b>Plain</b> Category',
        'general' => [
            'displays_on_pos' => 1,
        ],
    ]);

    $response->assertStatus(200);

    /**
     * "name" carries no `allowedTags` on the category form:
     * the blanket strip must survive (backward compatibility).
     */
    $category = ProductCategory::where('name', 'Plain Category')->first();

    expect($category)->not->toBeNull();
});

it('applies the per-field allowlist on option saves while keeping the blanket strip by default', function () {
    /**
     * @var Options $options
     */
    $options = app(Options::class);

    /**
     * an opted-in value keeps the declared tags only.
     */
    $options->set('sb_test_rich_option', '<p>keep</p><script>evil()</script>', null, '<p>');

    expect($options->get('sb_test_rich_option'))->toBe('<p>keep</p>evil()');

    /**
     * every other value keeps the blanket strip.
     */
    $options->set('sb_test_plain_option', '<b>bold</b> plain');

    expect($options->get('sb_test_plain_option'))->toBe('bold plain');
});
