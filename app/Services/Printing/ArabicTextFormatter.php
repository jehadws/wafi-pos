<?php

namespace App\Services\Printing;

use IntlChar;
use Normalizer;
use RuntimeException;

class ArabicTextFormatter
{
    private const CP864 = [
        0xFE80 => 0xBA, 0xFE81 => 0xC1, 0xFE82 => 0xC1, 0xFE83 => 0xC1, 0xFE84 => 0xC1,
        0xFE85 => 0xF5, 0xFE86 => 0xF5, 0xFE87 => 0xC1, 0xFE88 => 0xC1, 0xFE89 => 0xF7,
        0xFE8A => 0xFE, 0xFE8B => 0xFD, 0xFE8C => 0xFD, 0xFE8D => 0xC1, 0xFE8E => 0xC1,
        0xFE8F => 0xC2, 0xFE90 => 0xC2, 0xFE91 => 0xBE, 0xFE92 => 0xBE, 0xFE93 => 0xF8,
        0xFE94 => 0xC3, 0xFE95 => 0xC3, 0xFE96 => 0xC3, 0xFE97 => 0xBF, 0xFE98 => 0xBF,
        0xFE99 => 0xC4, 0xFE9A => 0xC4, 0xFE9B => 0xC0, 0xFE9C => 0xC0, 0xFE9D => 0xC6,
        0xFE9E => 0xC6, 0xFE9F => 0xC5, 0xFEA0 => 0xC5, 0xFEA1 => 0xC8, 0xFEA2 => 0xC8,
        0xFEA3 => 0xC7, 0xFEA4 => 0xC7, 0xFEA5 => 0xCA, 0xFEA6 => 0xCA, 0xFEA7 => 0xC9,
        0xFEA8 => 0xC9, 0xFEA9 => 0xCB, 0xFEAA => 0xCB, 0xFEAB => 0xCC, 0xFEAC => 0xCC,
        0xFEAD => 0xCD, 0xFEAE => 0xCD, 0xFEAF => 0xCE, 0xFEB0 => 0xCE, 0xFEB1 => 0xD0,
        0xFEB2 => 0xD0, 0xFEB3 => 0xCF, 0xFEB4 => 0xCF, 0xFEB5 => 0xD2, 0xFEB6 => 0xD2,
        0xFEB7 => 0xD1, 0xFEB8 => 0xD1, 0xFEB9 => 0xD4, 0xFEBA => 0xD4, 0xFEBB => 0xD3,
        0xFEBC => 0xD3, 0xFEBD => 0xD6, 0xFEBE => 0xD6, 0xFEBF => 0xD5, 0xFEC0 => 0xD5,
        0xFEC1 => 0xD7, 0xFEC2 => 0xD7, 0xFEC3 => 0xD7, 0xFEC4 => 0xD7, 0xFEC5 => 0xD8,
        0xFEC6 => 0xD8, 0xFEC7 => 0xD8, 0xFEC8 => 0xD8, 0xFEC9 => 0xDF, 0xFECA => 0xDF,
        0xFECB => 0xD9, 0xFECC => 0xDC, 0xFECD => 0xEC, 0xFECE => 0xEC, 0xFECF => 0xE0,
        0xFED0 => 0xE0, 0xFED1 => 0xE2, 0xFED2 => 0xE2, 0xFED3 => 0xE1, 0xFED4 => 0xE1,
        0xFED5 => 0xE4, 0xFED6 => 0xE4, 0xFED7 => 0xE3, 0xFED8 => 0xE3, 0xFED9 => 0xE6,
        0xFEDA => 0xE6, 0xFEDB => 0xE5, 0xFEDC => 0xE5, 0xFEDD => 0xE8, 0xFEDE => 0xEA,
        0xFEDF => 0xE7, 0xFEE0 => 0xE7, 0xFEE1 => 0xEC, 0xFEE2 => 0xEC, 0xFEE3 => 0xEB,
        0xFEE4 => 0xEB, 0xFEE5 => 0xEE, 0xFEE6 => 0xEE, 0xFEE7 => 0xED, 0xFEE8 => 0xED,
        0xFEE9 => 0xF4, 0xFEEA => 0xF3, 0xFEEB => 0xEF, 0xFEEC => 0xF2, 0xFEED => 0xF5,
        0xFEEE => 0xF5, 0xFEEF => 0xF6, 0xFEF0 => 0xF6, 0xFEF1 => 0xF7, 0xFEF2 => 0xFE,
        0xFEF3 => 0xFD, 0xFEF4 => 0xFD, 0xFEF5 => 0x9B, 0xFEF6 => 0x9B, 0xFEF7 => 0x9C,
        0xFEF8 => 0x9C, 0xFEF9 => 0x9D, 0xFEFA => 0x9D, 0xFEFB => 0x9E, 0xFEFC => 0x9E,
    ];

    private array $forms = [];

    public function __construct()
    {
        foreach ([[0xFB50, 0xFDFF], [0xFE70, 0xFEFF]] as [$start, $end]) {
            for ($codepoint = $start; $codepoint <= $end; $codepoint++) {
                $form = IntlChar::chr($codepoint);
                $base = Normalizer::normalize($form, Normalizer::FORM_KC);
                $name = IntlChar::charName($codepoint);
                if ($base === false || mb_strlen($base) !== 1 || ! $this->hasArabic($base)) {
                    continue;
                }
                if (preg_match('/(ISOLATED|FINAL|INITIAL|MEDIAL) FORM$/', $name, $matches)) {
                    $this->forms[$base][strtolower($matches[1])] = $form;
                }
            }
        }
    }

    public function hasArabic(?string $text): bool
    {
        return $text !== null && preg_match('/[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}\x{FB50}-\x{FDFF}\x{FE70}-\x{FEFF}]/u', $text) === 1;
    }

    /** Whether the printer's own character table can draw Arabic, so text needs no image. */
    public function supportsCodePage(string $encoding): bool
    {
        return in_array(strtolower(str_replace('-', '', $encoding)), ['cp864', 'cp1256'], true);
    }

    public function visual(string $text): string
    {
        if (! $this->hasArabic($text)) {
            return $text;
        }

        $characters = mb_str_split($text);
        $shaped = [];
        foreach ($characters as $index => $character) {
            if (! isset($this->forms[$character])) {
                $shaped[] = $character;
                continue;
            }

            $previous = $this->joiningCharacter($characters, $index, -1);
            $next = $this->joiningCharacter($characters, $index, 1);
            $joinsPrevious = $previous !== null
                && $this->connectsForward($previous)
                && $this->connectsBackward($character);
            $joinsNext = $next !== null
                && $this->connectsForward($character)
                && $this->connectsBackward($next);
            $form = match (true) {
                $joinsPrevious && $joinsNext => 'medial',
                $joinsPrevious => 'final',
                $joinsNext => 'initial',
                default => 'isolated',
            };
            $shaped[] = $this->forms[$character][$form] ?? $character;
        }

        $shapedText = implode('', $shaped);
        preg_match('/[\p{Arabic}A-Za-z]/u', $text, $firstStrong);
        if (isset($firstStrong[0]) && preg_match('/\p{Arabic}/u', $firstStrong[0])) {
            $visual = $this->reverse($shapedText);

            return preg_replace_callback('/[A-Za-z0-9](?:[A-Za-z0-9 .,:;@+%()\/_-]*[A-Za-z0-9])?/', fn (array $match) => $this->reverse($match[0]), $visual);
        }

        return preg_replace_callback('/[\p{Arabic}\p{M}]+/u', fn (array $match) => $this->reverse($match[0]), $shapedText);
    }

    public function encode(string $text, string $encoding = 'cp864'): string
    {
        $normalizedEncoding = strtolower(str_replace('-', '', $encoding));
        if ($normalizedEncoding === 'utf8' || in_array($normalizedEncoding, ['cp437', 'ascii'], true)) {
            return $this->encodeOrdered($text, $encoding);
        }

        return $this->encodeOrdered($this->visual($text), $encoding);
    }

    /**
     * Turns text that already sits in the order the print head will lay it down
     * (see visual()) into bytes. Table cells go through this so padding keeps
     * each column in place instead of mirroring the whole line.
     */
    public function encodeOrdered(string $visual, string $encoding = 'cp864'): string
    {
        $normalizedEncoding = strtolower(str_replace('-', '', $encoding));
        if ($normalizedEncoding === 'utf8') {
            return $visual;
        }

        if (in_array($normalizedEncoding, ['cp437', 'ascii'], true)) {
            return iconv('UTF-8', 'CP437//TRANSLIT', $this->cleanCurrency($visual)) ?: '';
        }

        if ($normalizedEncoding === 'cp1256') {
            $standard = normalizer_normalize($visual, Normalizer::FORM_KC) ?: $visual;

            return iconv('UTF-8', 'WINDOWS-1256//TRANSLIT', $standard) ?: '';
        }

        if ($normalizedEncoding !== 'cp864') {
            return $visual;
        }

        $bytes = '';
        foreach (mb_str_split($visual) as $character) {
            $codepoint = mb_ord($character);
            if (isset(self::CP864[$codepoint])) {
                $bytes .= chr(self::CP864[$codepoint]);
            } elseif ($codepoint < 128) {
                $bytes .= chr($codepoint);
            } else {
                $bytes .= '?';
            }
        }

        return $bytes;
    }

    public function rasterize(string $text, int $maxWidth, int $fontSize): array
    {
        $font = $this->fontPath();
        $visual = $this->visual($text);
        $bounds = imagettfbbox($fontSize, 0, $font, $visual);
        if ($bounds === false) {
            throw new RuntimeException('Unable to measure Arabic print text.');
        }

        $textWidth = max(1, $bounds[2] - $bounds[0]);
        $textHeight = max(1, $bounds[1] - $bounds[7]);
        $width = min($maxWidth, $textWidth + 4);
        $height = $textHeight + 6;
        $image = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        imagefill($image, 0, 0, $white);
        imagettftext($image, $fontSize, 0, 2 - $bounds[0], 3 - $bounds[7], $black, $font, $visual);

        $widthBytes = (int) ceil($width / 8);
        $data = '';
        for ($y = 0; $y < $height; $y++) {
            for ($byteX = 0; $byteX < $widthBytes; $byteX++) {
                $byte = 0;
                for ($bit = 0; $bit < 8; $bit++) {
                    $x = $byteX * 8 + $bit;
                    if ($x >= $width) {
                        continue;
                    }
                    $color = imagecolorat($image, $x, $y);
                    $gray = (($color >> 16) & 0xFF) + (($color >> 8) & 0xFF) + ($color & 0xFF);
                    if ($gray < 600) {
                        $byte |= 1 << (7 - $bit);
                    }
                }
                $data .= chr($byte);
            }
        }
        imagedestroy($image);

        return ['widthBytes' => $widthBytes, 'height' => $height, 'data' => $data];
    }

    private function joiningCharacter(array $characters, int $index, int $direction): ?string
    {
        for ($position = $index + $direction; isset($characters[$position]); $position += $direction) {
            if (preg_match('/^\p{M}$/u', $characters[$position])) {
                continue;
            }

            return isset($this->forms[$characters[$position]]) ? $characters[$position] : null;
        }

        return null;
    }

    private function connectsForward(string $character): bool
    {
        return isset($this->forms[$character]['initial']) || isset($this->forms[$character]['medial']);
    }

    private function connectsBackward(string $character): bool
    {
        return isset($this->forms[$character]['final']) || isset($this->forms[$character]['medial']);
    }

    private function reverse(string $text): string
    {
        return implode('', array_reverse(mb_str_split($text)));
    }

    private function cleanCurrency(string $text): string
    {
        return str_replace(
            ['ر.س', 'ر.س', 'د.ك', 'د.إ', 'ج.م', 'د.ب', 'ر.ع', 'ر.ق', 'د.ع', 'د.أ', 'دينار', 'ريال', 'درهم'],
            ['SAR', 'SAR', 'KWD', 'AED', 'EGP', 'BHD', 'OMR', 'QAR', 'IQD', 'JOD', 'Dinar', 'Rial', 'Dirham'],
            $text,
        );
    }

    private function fontPath(): string
    {
        $windows = getenv('WINDIR') ?: 'C:\\Windows';
        $fonts = array_filter([
            getenv('POS_ARABIC_FONT') ?: null,
            $windows.'\\Fonts\\tahoma.ttf',
            $windows.'\\Fonts\\arial.ttf',
            $windows.'\\Fonts\\segoeui.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ]);

        foreach ($fonts as $font) {
            if (is_file($font)) {
                return $font;
            }
        }

        throw new RuntimeException('Arabic printing requires Tahoma, Arial, Segoe UI, or POS_ARABIC_FONT.');
    }
}
