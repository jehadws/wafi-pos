<?php

namespace Tests\Unit;

use App\Models\License;
use PHPUnit\Framework\TestCase;

class LicenseSecurityTest extends TestCase
{
    public function test_inactive_license_is_invalid(): void
    {
        $license = new License([
            'hwid'       => 'test-hwid',
            'is_active'  => false,
            'key_string' => 'some-string',
        ]);

        $this->assertFalse($license->isValid());
    }

    public function test_empty_key_string_is_invalid(): void
    {
        $license = new License([
            'hwid'       => 'test-hwid',
            'is_active'  => true,
            'key_string' => null,
        ]);

        $this->assertFalse($license->isValid());
    }

    public function test_tampered_or_garbage_key_string_is_invalid(): void
    {
        $license = new License([
            'hwid'       => 'test-hwid',
            'is_active'  => true,
            'key_string' => 'random_garbage_data_inserted_via_tableplus',
        ]);

        $this->assertFalse($license->isValid());
    }

    public function test_cryptographically_signed_key_is_valid(): void
    {
        $validToken = 'eyJrZXlfaWQiOiJXQUZJLTE5RTE4NkVFIiwiY2xpZW50IjoiVGVzdCBTdG9yZSIsIm1heF9kZXZpY2VzIjoxLCJpc3N1ZWRfYXQiOiIyMDI2LTA5LTA0VDA0OjA5OjAyKzAwOjAwIiwiZXhwaXJlc19hdCI6bnVsbCwibm9uY2UiOiJlNTk5ZjgwYmQ4NDZkMWQ2MTQzZTY0MTAwNGUxMjg2NiJ9.a-pKM3sLdY93JBn6Fs0A59X2NkPg_HxHNAnDjKTTYyRVNYKY_lSXHCKy4jHGH8UTOSkvf9WKrRglEMRI1vF15s9F1XFyW9SJ4ardDmRjyiKzBh9TO7rMGgMAF7O1G6Milf-deZCexiGFVR9HRMEybNigphfEybPS3ehTl6chUbMk9z6TCT85m4v7eTpVuNiyzYtEcCucGHp2z9_4oHEwfnui5aXh1_VNtT4AhTkwdtBtW6-TRUy26Ir2yYAKaeXLSjv16XaST15dW6Ny55nmsOnrSEzNMmXSH6YMyDUiva8cIm0jLTIQ7lkfiZs5mYLLNOrB96KERcpuoGnV4fSL1A';

        $license = new License([
            'hwid'       => 'test-hwid',
            'is_active'  => true,
            'key_string' => $validToken,
        ]);

        $this->assertTrue($license->isValid());
    }
}
