<?php

namespace App\Services\Helpers;

trait Locale
{
    /**
     * Locales that render right-to-left.
     *
     * Keep in sync with `resources/js/lib/i18n/direction.ts` (`RTLLOCALES`).
     *
     * @var array<string>
     */
    public const RTL_LOCALES = [ 'ar', 'fa', 'ur', 'he', 'ps', 'ckb', 'sd' ];

    /**
     * Whether the given (or current) locale should render right-to-left.
     *
     * @param ?string $locale The locale tag (defaults to the current locale)
     * @return bool
     */
    public static function isRtlLocale( ?string $locale = null ): bool
    {
        $locale = strtolower( $locale ?? app()->getLocale() );
        $primary = explode( '-', str_replace( '_', '-', $locale ) )[0];

        return in_array( $primary, static::RTL_LOCALES, true );
    }
}