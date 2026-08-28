<?php

namespace App\Services;

class LicenseVerifierService
{
    /**
     * The Master Public Key used to verify license integrity offline.
     * Only keys signed with the corresponding Developer Private Key will pass verification.
     */
    public const PUBLIC_KEY = <<<PEM
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7/hZlw+L8A8DVf/2I324
xwOUeUonkJVDTfqOM+0elZd0MswIq6FsmajXJb1Sb92ddyydQ6fQjB3Xrj6OnkEU
jqF/JQR/4B5kgr72kmXqiJLjSLIFDJt5v2RfNxjtHSo3oSxdZ8t5GdPYBVZ9U6WV
m1jkXmMuCLaouIpi8l2qrPWQ4Emad4Fh86xR6oN9UtHuPpaul3+AakoZkXJeO1i8
3HvPyHZD0WVqoE7cYWYruLeqrDoZ5ledVuVts8eVHqqx+eLH66GcTO60iSyu5l3x
8ffkxIm/YH2GiVdemfOj8DqBxSDaNKN6vA4XKgSwXBYemkyMxOrlWbNX1yccQQIi
DwIDAQAB
-----END PUBLIC KEY-----
PEM;

    /**
     * Cryptographically verify a license key string.
     *
     * @param  string  $keyString  Format: Base64Url(PayloadJson) . "." . Base64Url(Signature)
     * @return array|null          Verified payload array if signature is authentic, null if forged/invalid
     */
    public static function verifyKey(string $keyString): ?array
    {
        $keyString = trim($keyString);

        if (!str_contains($keyString, '.')) {
            return null;
        }

        $parts = explode('.', $keyString);
        if (count($parts) !== 2) {
            return null;
        }

        [$encodedPayload, $encodedSignature] = $parts;

        $payloadJson = self::base64UrlDecode($encodedPayload);
        $signature = self::base64UrlDecode($encodedSignature);

        if (!$payloadJson || !$signature) {
            return null;
        }

        // Verify RSA-SHA256 signature against the embedded Developer Public Key
        $pubKeyResource = openssl_pkey_get_public(self::PUBLIC_KEY);
        if (!$pubKeyResource) {
            return null;
        }

        $verifyResult = openssl_verify($payloadJson, $signature, $pubKeyResource, OPENSSL_ALGO_SHA256);

        if ($verifyResult !== 1) {
            return null; // Signature verification failed — key is forged or tampered with
        }

        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) {
            return null;
        }

        // Check expiration date if present
        if (!empty($payload['expires_at'])) {
            $expiry = strtotime($payload['expires_at']);
            if ($expiry && $expiry < time()) {
                return null; // License key has expired
            }
        }

        return $payload;
    }

    /**
     * Base64 URL-safe encode.
     */
    public static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode.
     */
    public static function base64UrlDecode(string $data): ?string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        $decoded = base64_decode(strtr($data, '-_', '+/'), true);
        return $decoded === false ? null : $decoded;
    }
}
