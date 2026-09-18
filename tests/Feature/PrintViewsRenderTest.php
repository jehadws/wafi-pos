<?php

use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\OrderRefund;
use App\Models\Procurement;
use App\Models\Register;
use App\Models\RegisterHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    $this->actingAs($this->user);
});

function seedOrder(int $authorId, array $overrides = []): int
{
    $now = now()->toDateTimeString();
    return DB::table('subul_orders')->insertGetId(array_merge([
        'code' => 'ORD-' . Str::random(8),
        'description' => '',
        'title' => '',
        'type' => 'takeaway',
        'payment_status' => 'paid',
        'process_status' => 'pending',
        'delivery_status' => 'pending',
        'discount' => 0,
        'discount_type' => null,
        'discount_percentage' => 0,
        'shipping' => 0,
        'shipping_rate' => 0,
        'shipping_type' => null,
        'total_without_tax' => 100.00,
        'subtotal' => 100.00,
        'total_with_tax' => 100.00,
        'total_coupons' => 0,
        'total_cogs' => 0,
        'total' => 100.00,
        'tax_value' => 0,
        'products_tax_value' => 0,
        'tax_group_id' => null,
        'tax_type' => null,
        'tendered' => 100.00,
        'change' => 0,
        'customer_id' => 0,
        'note' => '',
        'note_visibility' => '',
        'author' => $authorId,
        'register_id' => null,
        'voidance_reason' => null,
        'created_at' => $now,
        'updated_at' => $now,
        'uuid' => (string) Str::uuid(),
    ], $overrides));
}

function seedRegister(array $overrides = []): int
{
    $now = now()->toDateTimeString();
    return DB::table('subul_registers')->insertGetId(array_merge([
        'name' => 'Register ' . Str::random(4),
        'description' => 'Test register',
        'status' => Register::STATUS_CLOSED,
        'balance' => 500.00,
        'author' => 1,
        'created_at' => $now,
        'updated_at' => $now,
        'uuid' => (string) Str::uuid(),
    ], $overrides));
}

function seedRegisterHistory(int $registerId, string $action, float $value, int $author): int
{
    $now = now()->toDateTimeString();
    return DB::table('subul_registers_history')->insertGetId([
        'register_id' => $registerId,
        'action' => $action,
        'value' => $value,
        'author' => $author,
        'description' => '',
        'created_at' => $now,
        'updated_at' => $now,
    ]);
}

function seedProvider(array $overrides = []): int
{
    $now = now()->toDateTimeString();
    return DB::table('subul_providers')->insertGetId(array_merge([
        'first_name' => 'Test',
        'last_name' => 'Provider',
        'email' => 'provider-' . Str::random(4) . '@test.com',
        'phone' => '555000' . Str::random(4),
        'author' => 1,
        'created_at' => $now,
        'updated_at' => $now,
        'uuid' => (string) Str::uuid(),
    ], $overrides));
}

function seedProcurement(int $authorId, int $providerId, array $overrides = []): int
{
    $now = now()->toDateTimeString();
    return DB::table('subul_procurements')->insertGetId(array_merge([
        'name' => 'PROC-' . Str::random(8),
        'provider_id' => $providerId,
        'value' => 500.00,
        'cost' => 0,
        'tax_value' => 0,
        'invoice_reference' => 'INV-' . Str::random(6),
        'automatic_approval' => false,
        'delivery_time' => $now,
        'invoice_date' => $now,
        'payment_status' => Procurement::PAYMENT_PAID,
        'delivery_status' => Procurement::DELIVERED,
        'total_items' => 0,
        'description' => 'Test procurement',
        'author' => $authorId,
        'created_at' => $now,
        'updated_at' => $now,
        'uuid' => (string) Str::uuid(),
    ], $overrides));
}

test('payment receipt endpoint returns 200 with valid inertia payload', function () {
    $orderId = seedOrder($this->user->id);

    $now = now()->toDateTimeString();
    $paymentId = DB::table('subul_orders_payments')->insertGetId([
        'order_id' => $orderId,
        'value' => 100.00,
        'identifier' => 'cash-payment',
        'author' => $this->user->id,
        'created_at' => $now,
        'updated_at' => $now,
        'uuid' => (string) Str::uuid(),
    ]);

    $payment = OrderPayment::findOrFail($paymentId);

    $this->get(route('sb.dashboard.orders-payment-receipt', ['orderPayment' => $payment]))
        ->assertOk();
});

test('refund receipt endpoint returns 200 with valid inertia payload', function () {
    $orderId = seedOrder($this->user->id);

    $now = now()->toDateTimeString();
    $refundId = DB::table('subul_orders_refunds')->insertGetId([
        'order_id' => $orderId,
        'author' => $this->user->id,
        'total' => 100.00,
        'tax_value' => 0,
        'shipping' => 0,
        'payment_method' => 'cash',
        'created_at' => $now,
        'updated_at' => $now,
    ]);

    $refund = OrderRefund::findOrFail($refundId);

    $this->get(route('sb.dashboard.orders-refund-receipt', ['refund' => $refund]))
        ->assertOk();
});

test('z-report endpoint returns 200 with valid inertia payload', function () {
    $registerId = seedRegister([
        'status' => Register::STATUS_CLOSED,
        'balance' => 500.00,
    ]);

    $openingId = seedRegisterHistory($registerId, RegisterHistory::ACTION_OPENING, 100.00, $this->user->id);
    $closingId = seedRegisterHistory($registerId, RegisterHistory::ACTION_CLOSING, 500.00, $this->user->id);

    $now = now()->toDateTimeString();
    DB::table('subul_payments_types')->insert([
        'identifier' => 'cash-payment',
        'label' => 'Cash',
        'active' => 1,
        'readonly' => 0,
        'priority' => 0,
        'description' => '',
        'author' => $this->user->id,
        'created_at' => $now,
        'updated_at' => $now,
    ]);

    seedOrder($this->user->id, [
        'register_id' => $registerId,
        'created_at' => DB::raw("datetime((select created_at from subul_registers_history where id = $openingId), '+1 minute')"),
    ]);

    $register = Register::findOrFail($registerId);

    $this->get(route('sb.dashboard.registers-zreport', ['register' => $register]))
        ->assertOk();
});

test('procurement invoice endpoint returns 200 with valid inertia payload', function () {
    $providerId = seedProvider();
    $procurementId = seedProcurement($this->user->id, $providerId, [
        'delivery_status' => Procurement::DELIVERED,
        'payment_status' => Procurement::PAYMENT_PAID,
    ]);

    $procurement = Procurement::findOrFail($procurementId);

    $this->get(route('sb.dashboard.procurement-invoice', ['procurement' => $procurement]))
        ->assertOk();
});
