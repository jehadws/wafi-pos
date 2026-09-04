/**
 * Single source of truth for right-to-left (RTL) locale detection.
 *
 * UI direction is a pure projection of `isRTLLocale(locale)`: the locale data
 * model drives both the `<html dir>` attribute and the radix `DirectionProvider`.
 *
 * Keep this set in sync with the server-side copy in
 * `app/Services/Helpers/Locale.php` (`RTL_LOCALES`).
 */
export const RTLLOCALES: ReadonlySet<string> = new Set(['ar', 'fa', 'ur', 'he', 'ps', 'ckb', 'sd']);

/**
 * Normalize a locale tag (e.g. "ar", "ar-SA", "ar_SA") to its primary language
 * component and test it against the RTL set.
 */
export function isRTLLocale(locale: string): boolean {
    const primary = locale.toLowerCase().replace('_', '-').split('-')[0];
    return RTLLOCALES.has(primary);
}