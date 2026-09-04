<?php

use App\Models\Notification;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('unauthenticated users cannot fetch notifications', function () {
    $this->getJson('/api/notifications')
        ->assertStatus(401);
});

test('authenticated users can fetch their notifications', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    Notification::create([
        'user_id' => $user1->id,
        'title' => 'Order Due',
        'description' => 'An order has turned due.',
        'identifier' => 'test-notif-1',
        'url' => '/dashboard/orders',
        'source' => 'system',
        'dismissable' => true,
    ]);

    Notification::create([
        'user_id' => $user2->id,
        'title' => 'Other User Notification',
        'description' => 'Should not be visible to user 1.',
        'identifier' => 'test-notif-2',
        'url' => '#',
        'source' => 'system',
        'dismissable' => true,
    ]);

    Sanctum::actingAs($user1);

    $response = $this->getJson('/api/notifications');

    $response->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment([
            'title' => 'Order Due',
            'identifier' => 'test-notif-1',
        ]);
});

test('authenticated users can delete a single notification', function () {
    $user = User::factory()->create();

    $notification = Notification::create([
        'user_id' => $user->id,
        'title' => 'Low Stock Warning',
        'description' => 'Product stock is low.',
        'identifier' => 'test-notif-stock',
        'url' => '#',
        'source' => 'system',
        'dismissable' => true,
    ]);

    Sanctum::actingAs($user);

    $response = $this->deleteJson("/api/notifications/{$notification->id}");

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
        ]);

    $this->assertDatabaseMissing('subul_notifications', [
        'id' => $notification->id,
    ]);
});

test('users cannot delete notifications belonging to other users', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $notification = Notification::create([
        'user_id' => $user2->id,
        'title' => 'Private Alert',
        'description' => 'Belongs to user 2.',
        'identifier' => 'test-notif-private',
        'url' => '#',
        'source' => 'system',
        'dismissable' => true,
    ]);

    Sanctum::actingAs($user1);

    $response = $this->deleteJson("/api/notifications/{$notification->id}");

    $response->assertStatus(404)
        ->assertJson([
            'status' => 'error',
        ]);

    $this->assertDatabaseHas('subul_notifications', [
        'id' => $notification->id,
    ]);
});

test('authenticated users can clear all their notifications', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    Notification::create([
        'user_id' => $user1->id,
        'title' => 'Notification 1',
        'description' => 'Desc 1',
        'identifier' => 'u1-notif-1',
        'url' => '#',
        'source' => 'system',
        'dismissable' => true,
    ]);

    Notification::create([
        'user_id' => $user1->id,
        'title' => 'Notification 2',
        'description' => 'Desc 2',
        'identifier' => 'u1-notif-2',
        'url' => '#',
        'source' => 'system',
        'dismissable' => true,
    ]);

    $otherNotification = Notification::create([
        'user_id' => $user2->id,
        'title' => 'User 2 Notification',
        'description' => 'Should remain',
        'identifier' => 'u2-notif-1',
        'url' => '#',
        'source' => 'system',
        'dismissable' => true,
    ]);

    Sanctum::actingAs($user1);

    $response = $this->deleteJson('/api/notifications/all');

    $response->assertOk()
        ->assertJson([
            'status' => 'success',
        ]);

    $this->assertDatabaseMissing('subul_notifications', [
        'user_id' => $user1->id,
    ]);

    $this->assertDatabaseHas('subul_notifications', [
        'id' => $otherNotification->id,
    ]);
});
