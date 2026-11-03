<?php

namespace App\Services\Printing;

/**
 * Code 128 encoder for printable ASCII.
 *
 * Digit runs ride Code C (two digits per symbol) and everything else Code B, with
 * the cheapest mix of switches chosen per code. An odd-length number such as a
 * 13-digit EAN therefore stays compact, which keeps each bar wide enough to scan at
 * 203 dpi. The label layout and the drawing both ask this class for the width, so
 * the space they plan is the space that gets printed.
 */
final class Code128
{
    private const START_B = 104;

    private const START_C = 105;

    private const SWITCH_TO_C = 99;

    private const SWITCH_TO_B = 100;

    private const STOP_PATTERN = '2331112';

    /** Code 128 bar/space widths for symbol values 0..102, one digit per element, each row 11 modules. */
    private const CODE128_PATTERNS = [
        '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
        '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
        '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
        '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
        '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
        '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
        '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
        '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
        '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
        '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
        '114131', '311141', '411131',
    ];

    /** Start characters select the numbering; the stop character carries an extra module. */
    private const CODE128_STARTS = [
        103 => '211412',
        104 => '211214',
        105 => '211232',
        106 => '2331112',
    ];

    /** Printable ASCII only: Code B carries nothing else. */
    public static function normalize(string $text): string
    {
        return preg_replace('/[^\x20-\x7E]/', '', $text) ?? '';
    }

    /** Width in modules, quiet zones excluded; 0 when nothing is printable. */
    public static function modules(string $text): int
    {
        $values = self::values($text);

        return $values === [] ? 0 : count($values) * 11 + 13;
    }

    /**
     * Bar and space widths in modules (bar first), stop character included.
     *
     * @return list<int>|null
     */
    public static function runs(string $text): ?array
    {
        $values = self::values($text);
        if ($values === []) {
            return null;
        }

        $runs = [];
        foreach (str_split(implode('', array_map(self::pattern(...), $values)).self::STOP_PATTERN) as $run) {
            $runs[] = (int) $run;
        }

        return $runs;
    }

    /** Symbol value to bar/space widths, start characters included (the stop pattern is not). */
    public static function patterns(): array
    {
        return self::CODE128_PATTERNS + self::CODE128_STARTS;
    }

    /**
     * Start, data (with any set switches) and checksum symbol values; the stop symbol is left out.
     *
     * @return list<int>
     */
    public static function values(string $text): array
    {
        $text = self::normalize($text);
        $length = strlen($text);
        if ($length === 0) {
            return [];
        }

        $pair = static fn (int $i): bool => $i + 1 < $length && ctype_digit($text[$i]) && ctype_digit($text[$i + 1]);

        // Fewest symbols to finish text[i:] while already in Code B ($b) or Code C ($c).
        $b = array_fill(0, $length + 2, 0);
        $c = array_fill(0, $length + 2, 0);
        for ($i = $length - 1; $i >= 0; $i--) {
            $viaChar = 1 + $b[$i + 1];
            $viaPair = $pair($i) ? 1 + $c[$i + 2] : PHP_INT_MAX;
            $b[$i] = min($viaChar, $viaPair === PHP_INT_MAX ? PHP_INT_MAX : 1 + $viaPair);
            $c[$i] = min($viaPair, 1 + $viaChar);
        }

        $inC = $pair(0) && $c[0] <= $b[0];
        $values = [$inC ? self::START_C : self::START_B];
        for ($i = 0; $i < $length;) {
            if ($inC) {
                if ($pair($i) && 1 + $c[$i + 2] <= 1 + 1 + $b[$i + 1]) {
                    $values[] = (int) substr($text, $i, 2);
                    $i += 2;
                } else {
                    $values[] = self::SWITCH_TO_B;
                    $inC = false;
                }
            } elseif ($pair($i) && 2 + $c[$i + 2] < 1 + $b[$i + 1]) {
                $values[] = self::SWITCH_TO_C;
                $inC = true;
            } else {
                $values[] = ord($text[$i]) - 32;
                $i++;
            }
        }

        $checksum = $values[0];
        foreach (array_slice($values, 1) as $index => $value) {
            $checksum += $value * ($index + 1);
        }
        $values[] = $checksum % 103;

        return $values;
    }

    private static function pattern(int $value): string
    {
        return self::CODE128_STARTS[$value] ?? self::CODE128_PATTERNS[$value];
    }
}
