<?php

use App\Services\Helper;

beforeEach(function () {
    clearDesktopFlag();
});

afterEach(function () {
    clearDesktopFlag();
});

test('the desktop shell reads the install state as JSON', function () {
    $this->artisan('subul:desktop-state')
        ->expectsOutputToContain('"installed":true')
        ->assertSuccessful();
});

test('migrate-app is a successful no-op when nothing is pending', function () {
    $this->artisan('subul:migrate-app')->assertSuccessful();
});

test('the setup wizard is blocked when running inside the desktop shell', function () {
    setDesktopFlag();

    expect(Helper::isDesktop())->toBeTrue();

    $this->get('/do-setup/')->assertForbidden();
    $this->getJson('/api/setup/check-database')->assertForbidden();
});

test('the setup API stays reachable in a browser', function () {
    expect(Helper::isDesktop())->toBeFalse();

    $this->getJson('/api/setup/check-database')->assertOk();
});

test('the database update page is blocked when running inside the desktop shell', function () {
    setDesktopFlag();

    $this->get('/database-update')->assertForbidden();
});

function setDesktopFlag(): void
{
    putenv('SB_DESKTOP=true');
    $_ENV['SB_DESKTOP'] = 'true';
    $_SERVER['SB_DESKTOP'] = 'true';
}

function clearDesktopFlag(): void
{
    putenv('SB_DESKTOP');
    unset($_ENV['SB_DESKTOP'], $_SERVER['SB_DESKTOP']);
}
