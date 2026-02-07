import { render, screen } from '@testing-library/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { AspectRatio } from '@/shared/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import {
  Drawer,
  DrawerClose,
  DrawerOverlay,
  DrawerPortal,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/ui/drawer';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/shared/ui/empty';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/shared/ui/hover-card';
import { Input } from '@/shared/ui/input';
import { Kbd, KbdGroup } from '@/shared/ui/kbd';
import { Label } from '@/shared/ui/label';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { Progress } from '@/shared/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { ScrollArea, ScrollBar } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';
import { Slider } from '@/shared/ui/slider';
import { Spinner } from '@/shared/ui/spinner';
import { Switch } from '@/shared/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/shared/ui/toast';
import { Toggle } from '@/shared/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/shared/ui/command';

describe('UI primitives', () => {
  test('renders basic components', () => {
    render(
      <div>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Alert>
          <AlertTitle>Alert</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
        <AspectRatio ratio={16 / 9}>
          <div>Aspect</div>
        </AspectRatio>
        <Avatar>
          <AvatarImage src="/avatar.png" alt="Avatar" />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
            <CardDescription>Desc</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Body</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
        <Checkbox checked aria-label="check" />
        <Collapsible open>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Hidden</CollapsibleContent>
        </Collapsible>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <span>Icon</span>
            </EmptyMedia>
            <EmptyMedia>
              <span>Default</span>
            </EmptyMedia>
            <EmptyTitle>Empty</EmptyTitle>
            <EmptyDescription>None</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>Extra</EmptyContent>
        </Empty>
        <Input aria-label="input" />
        <Textarea aria-label="textarea" />
        <Kbd>Cmd</Kbd>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>K</Kbd>
        </KbdGroup>
        <Label>Label</Label>
        <Progress value={50} />
        <Progress />
        <RadioGroup defaultValue="one">
          <RadioGroupItem value="one" />
        </RadioGroup>
        <ScrollArea>
          Scroll
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Separator />
        <Skeleton />
        <Slider defaultValue={[50]} max={100} step={1} />
        <Slider value={[25, 75]} />
        <Slider />
        <Spinner />
        <Switch checked />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Head</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
          <TableCaption>Caption</TableCaption>
        </Table>
        <Tabs defaultValue="tab-1">
          <TabsList>
            <TabsTrigger value="tab-1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1">Tab Content</TabsContent>
        </Tabs>
        <Toggle pressed>Toggle</Toggle>
        <ToggleGroup type="single" value="one">
          <ToggleGroupItem value="one">One</ToggleGroupItem>
        </ToggleGroup>
      </div>
    );

    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  test('renders overlay components', () => {
    render(
      <div>
        <AlertDialog open>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay />
            <div>Portal Content</div>
          </AlertDialogPortal>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm</AlertDialogTitle>
              <AlertDialogDescription>Details</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Ok</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Drawer open>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerPortal>
            <DrawerOverlay />
            <div>Drawer Portal</div>
          </DrawerPortal>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer</DrawerTitle>
              <DrawerDescription>Desc</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>Footer</DrawerFooter>
            <DrawerClose>Close Drawer</DrawerClose>
          </DrawerContent>
        </Drawer>
        <Popover open>
          <PopoverTrigger>Popover</PopoverTrigger>
          <PopoverAnchor />
          <PopoverContent>Popover Content</PopoverContent>
        </Popover>
        <HoverCard open>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Hover Content</HoverCardContent>
        </HoverCard>
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger>Tip</TooltipTrigger>
            <TooltipContent>Tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Sheet open>
          <SheetTrigger>Sheet</SheetTrigger>
          <SheetPortal>
            <SheetOverlay />
          </SheetPortal>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>Sheet Desc</SheetDescription>
            </SheetHeader>
            <SheetFooter>Sheet Footer</SheetFooter>
            <SheetClose>Close Sheet</SheetClose>
          </SheetContent>
        </Sheet>
        <Sheet open>
          <SheetContent side="top">
            <SheetHeader>
              <SheetTitle>Top Sheet</SheetTitle>
              <SheetDescription>Top Desc</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Sheet open>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Bottom Sheet</SheetTitle>
              <SheetDescription>Bottom Desc</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Drawer')).toBeInTheDocument();
  });

  test('renders toast and command components', () => {
    const { container } = render(
      <div>
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast</ToastTitle>
            <ToastDescription>Toast Desc</ToastDescription>
            <ToastAction altText="action">Action</ToastAction>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup heading="Group">
              <CommandItem>Item</CommandItem>
              <CommandSeparator />
              <CommandShortcut>Cmd</CommandShortcut>
            </CommandGroup>
          </CommandList>
        </Command>
        <CommandDialog open>
          <CommandInput placeholder="Search" />
        </CommandDialog>
      </div>
    );

    expect(screen.getByText('Toast')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="command-empty"]')
    ).toBeInTheDocument();
  });
});
