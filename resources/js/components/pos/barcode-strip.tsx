'use client';

import { cn } from '@/lib/utils';

/**
 * A Code128 footprint for previews: bar widths are derived from the encoded
 * value so the same code always draws the same strip, with the human-readable
 * text the printer puts underneath it.
 */
export function BarcodeStrip({
  value,
  height = 32,
  showText = true,
  textSize = 10,
  className,
}: {
  value: string;
  height?: number;
  showText?: boolean;
  textSize?: number;
  className?: string;
}) {
  const source = value || '0';
  const bars = Array.from(source.slice(0, 48)).map((char, index) => 1 + ((char.charCodeAt(0) + index * 7) % 4));

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="flex w-full items-stretch overflow-hidden" style={{ height }} aria-hidden>
        {bars.flatMap((weight, index) => [
          <span key={`bar-${index}`} className="bg-neutral-900" style={{ flexGrow: weight, flexBasis: 0 }} />,
          <span key={`space-${index}`} className="bg-transparent" style={{ flexGrow: 1, flexBasis: 0 }} />,
        ])}
      </div>
      {showText && (
        <span className="leading-none tracking-[0.2em] text-neutral-900" style={{ fontSize: textSize }}>
          {source}
        </span>
      )}
    </div>
  );
}
