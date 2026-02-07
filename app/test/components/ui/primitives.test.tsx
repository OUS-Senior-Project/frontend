import { render, screen } from '@testing-library/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardAction,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
} from '@/components/ui/drawer';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
} from '@/components/ui/command';

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
