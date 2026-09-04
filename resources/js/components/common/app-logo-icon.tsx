import { cn } from '@/lib/utils';
import { ImgHTMLAttributes } from 'react';

export interface AppLogoIconProps extends ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
    alt?: string;
}

export default function AppLogoIcon({ className, alt = 'Subul Logo', ...props }: AppLogoIconProps) {
    return (
        <img
            src="/logo.svg"
            alt={alt}
            className={cn('h-full w-full object-contain shrink-0 select-none pointer-events-none', className)}
            loading="eager"
            decoding="async"
            {...props}
        />
    );
}
