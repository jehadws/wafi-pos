'use client';

import { useEffect, useRef } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export default function QRCode({ value, size = 200, bgColor = '#FFFFFF', fgColor = '#000000', level = 'L' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Dynamically import QRious (much smaller than other QR libraries)
      import('qrious').then((QRious) => {
        if (canvasRef.current) {
          new QRious.default({
            element: canvasRef.current,
            value: value,
            size: size,
            background: bgColor,
            foreground: fgColor,
            level: level,
          });
        }
      });
    }
  }, [value, size, bgColor, fgColor, level]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
