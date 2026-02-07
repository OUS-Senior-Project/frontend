import { render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/shared/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuPortal,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/shared/ui/context-menu';
import {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarGroup,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from '@/shared/ui/menubar';
import {
  NavigationMenu,
  NavigationMenuPrimitiveRoot,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from '@/shared/ui/navigation-menu';

describe('Menu components', () => {
  test('dropdown menu renders items and variants', () => {
    render(
      <div>
        <DropdownMenu open>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={8}>
            <DropdownMenuLabel inset>Label</DropdownMenuLabel>
            <DropdownMenuItem inset variant="destructive">
              Delete
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="one">
              <DropdownMenuRadioItem value="one">
                One
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuShortcut>Cmd</DropdownMenuShortcut>
            <DropdownMenuSub open>
              <DropdownMenuSubTrigger inset>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>Subcontent</DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu open>
          <DropdownMenuTrigger>Open Default</DropdownMenuTrigger>
          <DropdownMenuPortal>
            <div>Portal Content</div>
          </DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Default</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Subcontent')).toBeInTheDocument();
  });

  test('context menu renders items', () => {
    render(
      <ContextMenu open onOpenChange={() => {}}>
        <ContextMenuTrigger>Target</ContextMenuTrigger>
        <ContextMenuContent forceMount>
          <ContextMenuLabel inset>Context</ContextMenuLabel>
          <ContextMenuGroup>
            <ContextMenuItem inset>Item</ContextMenuItem>
            <ContextMenuShortcut>Cmd</ContextMenuShortcut>
          </ContextMenuGroup>
          <ContextMenuCheckboxItem checked>Checked</ContextMenuCheckboxItem>
          <ContextMenuRadioGroup value="one">
            <ContextMenuRadioItem value="one">One</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuSub open>
            <ContextMenuSubTrigger inset>More</ContextMenuSubTrigger>
            <ContextMenuSubContent>Subcontent</ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
        <ContextMenuPortal>
          <div>Portal Node</div>
        </ContextMenuPortal>
      </ContextMenu>
    );

    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Subcontent')).toBeInTheDocument();
  });

  test('menubar renders items', () => {
    render(
      <Menubar>
        <MenubarMenu open>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent forceMount>
            <MenubarLabel inset>Menu</MenubarLabel>
            <MenubarGroup>
              <MenubarItem inset>Item</MenubarItem>
              <MenubarShortcut>Shift+P</MenubarShortcut>
            </MenubarGroup>
            <MenubarCheckboxItem checked>Checked</MenubarCheckboxItem>
            <MenubarRadioGroup value="one">
              <MenubarRadioItem value="one">One</MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarSeparator />
            <MenubarSub open>
              <MenubarSubTrigger inset>More</MenubarSubTrigger>
              <MenubarSubContent>Subcontent</MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarPortal>
          <div>Portal Node</div>
        </MenubarPortal>
      </Menubar>
    );

    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Subcontent')).toBeInTheDocument();
  });

  test('navigation menu supports viewport toggle', () => {
    const { rerender } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Nav</NavigationMenuTrigger>
            <NavigationMenuContent forceMount>
              <NavigationMenuLink href="#">Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuIndicator forceMount />
        <NavigationMenuViewport />
      </NavigationMenu>
    );

    expect(screen.getByText('Link')).toBeInTheDocument();

    rerender(
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Nav</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#">Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuIndicator />
      </NavigationMenu>
    );
    expect(navigationMenuTriggerStyle()).toContain('group');
    expect(NavigationMenuPrimitiveRoot).toBeDefined();
    expect(NavigationMenuViewport).toBeDefined();
  });
});
