import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { emptyMediaVariants } from './empty-media';

export function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="empty" className={cn('flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12', className)} {...props} />;
}

export function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="empty-header" className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)} {...props} />;
}

export function EmptyMedia({ className, variant = 'default', ...props }: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return <div data-slot="empty-icon" data-variant={variant} className={cn(emptyMediaVariants({ variant, className }))} {...props} />;
}

export function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="empty-title" className={cn('text-lg font-medium tracking-tight', className)} {...props} />;
}

export function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <div data-slot="empty-description" className={cn('text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4', className)} {...props} />;
}

export function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="empty-content" className={cn('flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance', className)} {...props} />;
}
