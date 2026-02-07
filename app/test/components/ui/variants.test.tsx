import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/shared/ui/button';
import { Badge, badgeVariants } from '@/shared/ui/badge';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
} from '@/shared/ui/button-group';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/shared/ui/pagination';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollDownButton,
  SelectScrollUpButton,
} from '@/shared/ui/select';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@/shared/ui/input-group';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  BreadcrumbPage,
} from '@/shared/ui/breadcrumb';
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemHeader,
  ItemFooter,
  ItemSeparator,
} from '@/shared/ui/item';

describe('UI variants and branches', () => {
  test('button and badge support asChild', () => {
    render(
      <div>
        <Button asChild>
          <a href="#">Link</a>
        </Button>
        <Badge asChild>
          <a href="#">Badge</a>
        </Badge>
        <Badge>Default Badge</Badge>
        <Button>Button</Button>
      </div>
    );

    expect(screen.getByText('Link')).toBeInTheDocument();
    expect(screen.getByText('Badge')).toBeInTheDocument();
    expect(badgeVariants({ variant: 'secondary' })).toContain('bg-secondary');
    expect(badgeVariants({ variant: 'destructive' })).toContain('bg-destructive');
    expect(badgeVariants({ variant: 'outline' })).toContain('text-foreground');
  });

  test('button group and pagination render', () => {
    render(
      <div>
        <ButtonGroup orientation="vertical">
          <ButtonGroupText asChild>
            <span>Grouped</span>
          </ButtonGroupText>
          <ButtonGroupSeparator orientation="horizontal" />
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>Default Group</ButtonGroupText>
          <ButtonGroupSeparator />
        </ButtonGroup>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive href="#">
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );

    expect(screen.getByText('Grouped')).toBeInTheDocument();
    expect(screen.getByText('Default Group')).toBeInTheDocument();
    expect(buttonGroupVariants({ orientation: 'horizontal' })).toContain('rounded');
    expect(buttonGroupVariants({ orientation: 'vertical' })).toContain('flex-col');
  });

  test('select handles popper and item-aligned positions', () => {
    render(
      <div>
        <Select value="one" onValueChange={() => {}}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="one">One</SelectItem>
          </SelectContent>
        </Select>
        <Select value="two" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            <SelectItem value="two">Two</SelectItem>
          </SelectContent>
        </Select>
        <Select value="three" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectGroup>
              <SelectLabel>Group</SelectLabel>
              <SelectItem value="three">Three</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      </div>
    );

    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  test('input group addon focuses input unless clicking button', () => {
    const focusSpy = jest
      .spyOn(HTMLInputElement.prototype, 'focus')
      .mockImplementation(() => {});

    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>Prefix</InputGroupText>
          <button type="button">X</button>
        </InputGroupAddon>
        <InputGroupInput aria-label="group-input" />
        <InputGroupTextarea aria-label="group-textarea" />
        <InputGroupButton>Go</InputGroupButton>
      </InputGroup>
    );

    fireEvent.click(screen.getByText('Prefix'));
    expect(focusSpy).toHaveBeenCalled();

    focusSpy.mockClear();
    fireEvent.click(screen.getByText('X'));
    expect(focusSpy).not.toHaveBeenCalled();

    focusSpy.mockRestore();
  });

  test('breadcrumb and item variants render', () => {
    render(
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href="#">Home</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Library</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <span>/</span>
            </BreadcrumbSeparator>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
        <ItemGroup>
          <Item>
            <ItemMedia variant="icon">
              <span>Icon</span>
            </ItemMedia>
            <ItemContent>
              <ItemHeader>Header</ItemHeader>
              <ItemTitle>Title</ItemTitle>
              <ItemDescription>Description</ItemDescription>
            </ItemContent>
            <ItemActions>Action</ItemActions>
            <ItemFooter>Footer</ItemFooter>
          </Item>
          <ItemSeparator />
          <Item asChild>
            <a href="#">Linked Item</a>
          </Item>
          <Item>
            <ItemMedia>
              <span>Default Media</span>
            </ItemMedia>
          </Item>
        </ItemGroup>
      </div>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Linked Item')).toBeInTheDocument();
  });
});
