<?php

// The ext-sockets API is not used: TCP targets are written with stream_socket_client().
it('loads the extensions required by integrated printing', function () {
    expect(extension_loaded('gd'))->toBeTrue()
        ->and(gd_info()['FreeType Support'] ?? false)->toBeTrue()
        ->and(function_exists('stream_socket_client'))->toBeTrue()
        ->and(extension_loaded('iconv'))->toBeTrue()
        ->and(extension_loaded('mbstring'))->toBeTrue()
        ->and(extension_loaded('intl'))->toBeTrue();
});

it('keeps the legacy printing compatibility baseline readable', function () {
    $fixture = json_decode(
        file_get_contents(__DIR__.'/../Fixtures/Printing/legacy-output.json'),
        true,
        flags: JSON_THROW_ON_ERROR,
    );

    expect($fixture['legacyOutputs']['receiptCp864']['knownBrokenArabicEncoding'])->toBeTrue()
        ->and($fixture['textSamples'][0]['intendedCp864Hex'])->toBe('c3fdbecdd920f8f5f2e3')
        ->and($fixture['legacyOutputs']['drawerPin0']['hex'])->toBe('1b401b74281b700019fa');
});
