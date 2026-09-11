import Settings from '@/lib/settings';
import { cn } from '@/lib/utils';
import { ImgHTMLAttributes } from 'react';

export interface AppLogoIconProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  alt?: string;
}

export default function AppLogoIcon({ className, alt, ...props }: AppLogoIconProps) {
  const storeName = Settings.get()?.identification?.sb_store_name || 'Subul';
  const logoUrl = Settings.get()?.identification?.sb_store_square_logo || '/logo.svg';
  return (
    <img
      src={logoUrl}
      alt={alt || `${storeName} Logo`}
      className={cn('pointer-events-none h-full w-full shrink-0 object-contain select-none', className)}
      loading="eager"
      decoding="async"
      onError={(e) => {
        // Fallback to default logo if custom logo fails to load
        (e.target as HTMLImageElement).src = '/logo.svg';
      }}
      {...props}
    />
  );
}
