'use client';

import * as React from 'react';

import { cn } from '@/shared/utils/cn';

import { useSidebar } from './context';
import { DesktopSidebar } from './desktop-sidebar';
import { MobileSidebar } from './mobile-sidebar';

type SidebarRootProps = React.ComponentProps<'div'> & {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
};

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: SidebarRootProps) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === 'none') {
    return (
      <div data-slot="sidebar" className={cn('bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col', className)} {...props}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileSidebar side={side} openMobile={openMobile} setOpenMobile={setOpenMobile} {...props}>
        {children}
      </MobileSidebar>
    );
  }

  return (
    <DesktopSidebar side={side} variant={variant} state={state} collapsible={collapsible} className={className} {...props}>
      {children}
    </DesktopSidebar>
  );
}
