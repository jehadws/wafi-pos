/**
 * Utility for playing audio clips with caching to prevent memory leaks.
 */
const audioCache = new Map<string, HTMLAudioElement>();

export function playSound(url: string | undefined | null): void {
    if (!url || typeof window === 'undefined' || url.trim().length === 0) return;
    if (url === 'disabled') return; // settings sentinel — audio disabled

    try {
        let audio = audioCache.get(url);
        if (!audio) {
            audio = new Audio(url);
            audioCache.set(url, audio);
        }
        audio.currentTime = 0;
        audio.play().catch((err: Error) => {
            // Autoplay may be blocked by browser policy — non-fatal
            console.warn('[POS] Sound playback blocked:', err.message);
        });
    } catch (err: any) {
        console.warn('[POS] Audio error:', err?.message);
    }
}
