import * as React from 'react';
export {
  NavigationMenuPrimitiveRoot,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from './navigation-menu-primitives';
export {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuLink,
  NavigationMenuViewport,
} from './navigation-menu-content';

import { NavigationMenuPrimitiveRoot } from './navigation-menu-primitives';
import { NavigationMenuViewport } from './navigation-menu-content';

export function NavigationMenu({
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitiveRoot> & {
  viewport?: boolean;
}) {
  return (
    <NavigationMenuPrimitiveRoot data-viewport={viewport} {...props}>
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitiveRoot>
  );
}
