<?php

namespace App\Services\Printing;

class TestPrintSamples
{
    public function receipt(string $sample = 'mixed'): array
    {
        return match ($sample) {
            'arabic' => [
                'storeName' => 'متجر الخير للتجزئة',
                'storeAddress' => 'طريق الملك فهد، مجمع ٤٠٠، الرياض',
                'storePhone' => 'هاتف: 0501234567',
                'storeEmail' => 'info@subul.sa',
                'orderCode' => 'TEST-ORDER-001',
                'date' => now()->format('Y-m-d H:i'),
                'cashier' => 'أحمد',
                'orderType' => 'تيك أواي',
                'customer' => 'خالد المنصور',
                'items' => [
                    ['name' => 'قهوة عربية', 'quantity' => 2, 'price' => '5.00', 'total' => '10.00'],
                    ['name' => 'كرك صغير', 'quantity' => 1, 'price' => '3.50', 'total' => '3.50'],
                    ['name' => 'شاي أخضر', 'quantity' => 3, 'price' => '2.00', 'total' => '6.00'],
                ],
                'subtotal' => '19.50',
                'tax' => '2.93',
                'total' => '22.43',
                'tendered' => '50.00',
                'change' => '27.57',
                'barcode' => 'TEST123456',
                'footer' => 'شكراً لزيارتكم!',
            ],
            'english' => [
                'storeName' => 'Subul',
                'storeAddress' => '123 Test Street, Suite 100',
                'storePhone' => '+1 234 567 8900',
                'storeEmail' => 'info@subul.com',
                'orderCode' => 'TEST-ORDER-001',
                'date' => now()->format('Y-m-d H:i'),
                'cashier' => 'System Test',
                'orderType' => 'takeaway',
                'customer' => 'John Doe',
                'items' => [
                    ['name' => 'Espresso Double Shot', 'quantity' => 2, 'price' => '5.00', 'total' => '10.00'],
                    ['name' => 'Butter Croissant', 'quantity' => 1, 'price' => '3.50', 'total' => '3.50'],
                    ['name' => 'Iced Tea', 'quantity' => 3, 'price' => '2.00', 'total' => '6.00'],
                ],
                'subtotal' => '19.50',
                'tax' => '2.93',
                'total' => '22.43',
                'tendered' => '50.00',
                'change' => '27.57',
                'barcode' => 'TEST123456',
                'footer' => 'Thank you for your visit!',
            ],
            default => [
                'storeName' => 'متجر الاختبار | Subul',
                'storeAddress' => '123 Test Street, Suite 100',
                'storePhone' => '+1 234 567 8900',
                'orderCode' => 'TEST-ORDER-001',
                'date' => now()->format('Y-m-d H:i'),
                'cashier' => 'System Test',
                'orderType' => 'takeaway',
                'items' => [
                    ['name' => 'Thermal Direct Test Item', 'quantity' => 1, 'price' => '5.00', 'total' => '5.00'],
                    ['name' => 'قهوة عربية | Arabic Coffee', 'quantity' => 2, 'price' => '2.50', 'total' => '5.00'],
                ],
                'subtotal' => '10.00',
                'total' => '10.00',
                'tendered' => '20.00',
                'change' => '10.00',
                'barcode' => 'TEST123456',
                'footer' => 'شكراً لزيارتكم! | Thank you for your visit!',
            ],
        };
    }

    public function label(): array
    {
        return [
            'storeName' => 'متجر الاختبار',
            'name' => 'TEST PRODUCT 500ML | منتج تجريبي',
            'price' => '$9.99',
            'barcode' => '123456789012',
            'sku' => 'TEST-001',
            'unit' => 'pcs',
        ];
    }
}
