import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  useSidebar,
} from '@/shared/ui/sidebar';

jest.mock('@/shared/hooks/useIsMobile', () => ({
  useIsMobile: jest.fn(),
}));

const useIsMobile = require('@/shared/hooks/useIsMobile').useIsMobile as jest.Mock;

describe('Sidebar', () => {
  test('throws when used outside provider', () => {
    expect(() => render(<Sidebar />)).toThrow(
      'useSidebar must be used within a SidebarProvider.'
    );
  });

  test('renders desktop sidebar and menu variants', () => {
    useIsMobile.mockReturnValue(false);

    const handleOpen = jest.fn();

    render(
      <SidebarProvider open={false} onOpenChange={handleOpen}>
        <Sidebar collapsible="offcanvas" variant="floating">
          <SidebarHeader>
            <SidebarInput aria-label="sidebar-search" />
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <span>Group</span>
              </SidebarGroupLabel>
              <SidebarGroupLabel>Default Group</SidebarGroupLabel>
              <SidebarGroupAction asChild>
                <button type="button">+</button>
              </SidebarGroupAction>
              <SidebarGroupAction>Default Action</SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Tip" isActive>
                      Menu
                    </SidebarMenuButton>
                    <SidebarMenuAction showOnHover>Action</SidebarMenuAction>
                    <SidebarMenuAction>Secondary</SidebarMenuAction>
                    <SidebarMenuAction asChild>
                      <button type="button">AsChild</button>
                    </SidebarMenuAction>
                    <SidebarMenuBadge>1</SidebarMenuBadge>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton />
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton size="sm" isActive>
                    Sub
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton>Sub Default</SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <a href="#">Sub Link</a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>Footer</SidebarFooter>
        </Sidebar>
        <SidebarTrigger />
        <SidebarRail />
        <SidebarInset />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Toggle Sidebar'));
    expect(handleOpen).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
  });

  test('uncontrolled sidebar updates internal state', () => {
    useIsMobile.mockReturnValue(false);

    function Controller() {
      const { open, setOpen } = useSidebar();
      return (
        <div>
          <span data-testid="open-state">{open ? 'open' : 'closed'}</span>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      );
    }

    render(
      <SidebarProvider defaultOpen={true}>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Item</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <Controller />
      </SidebarProvider>
    );

    expect(screen.getByTestId('open-state')).toHaveTextContent('open');
    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('open-state')).toHaveTextContent('closed');
  });

  test('renders expanded right sidebar variant', () => {
    useIsMobile.mockReturnValue(false);

    const { container } = render(
      <SidebarProvider open={true} onOpenChange={jest.fn()}>
        <Sidebar side="right" variant="sidebar">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Right</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );

    expect(
      container.querySelector('[data-slot="sidebar"][data-state="expanded"]')
    ).toBeInTheDocument();
  });

  test('renders mobile sidebar and tooltip hidden', () => {
    useIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider defaultOpen={true}>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={{ children: 'Tip' }}>
                  Mobile
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    fireEvent.click(screen.getByText('Toggle Sidebar'));
    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  test('supports non-collapsible sidebar', () => {
    useIsMobile.mockReturnValue(false);
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">Static</a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );

    expect(screen.getByText('Static')).toBeInTheDocument();
  });
});
