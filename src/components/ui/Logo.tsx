import { cn } from '../../lib/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'light';
}

export const Logo = ({ size = 'md', className, variant = 'default' }: LogoProps) => {
  return (
    <div className={cn('flex flex-col', className)}>
      <span className={cn(
        'font-outfit font-extrabold tracking-tight',
        variant === 'default' ? 'text-on-surface' : 'text-white',
        {
          'text-lg': size === 'sm',
          'text-2xl': size === 'md',
          'text-3xl': size === 'lg',
        }
      )}>
        SSA<span className={variant === 'light' ? 'text-primary-muted' : 'text-primary'}>BEAUTE</span>
      </span>
      {size !== 'sm' && (
        <span className={cn(
          'text-[10px] uppercase tracking-[0.2em] font-semibold mt-0.5',
          variant === 'default' ? 'text-on-surface-variant' : 'text-white/70'
        )}>
          Cosmetología
        </span>
      )}
    </div>
  )
}
