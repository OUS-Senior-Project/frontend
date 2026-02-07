import * as React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '@/shared/ui/form';
import {
  Field,
  FieldSet,
  FieldGroup,
  FieldLegend,
  FieldContent,
  FieldLabel,
  FieldTitle,
  FieldDescription,
  FieldSeparator,
  FieldError,
} from '@/shared/ui/field';
import { useForm } from 'react-hook-form';

function FormFixture({ withError }: { withError?: boolean }) {
  const form = useForm({ defaultValues: { name: '' } });

  React.useEffect(() => {
    if (withError) {
      form.setError('name', { message: 'Required' });
    }
  }, [withError, form]);

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <input {...field} aria-label="name-input" />
              </FormControl>
              <FormDescription>Helper</FormDescription>
              <FormMessage>Fallback</FormMessage>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

describe('Form components', () => {
  test('renders form fields without errors', () => {
    render(<FormFixture />);
    expect(screen.getByLabelText('name-input')).toBeInTheDocument();
    expect(screen.getByText('Helper')).toBeInTheDocument();
    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });

  test('renders error message when form has errors', () => {
    render(<FormFixture withError />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  test('FormMessage returns null when error has no message', () => {
    function EmptyErrorFixture() {
      const form = useForm({ defaultValues: { name: '' } });
      React.useEffect(() => {
        form.setError('name', {} as any);
      }, [form]);

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input {...field} aria-label="empty-error-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    }

    render(<EmptyErrorFixture />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('FormMessage returns null when empty', () => {
    function EmptyMessageFixture() {
      const form = useForm({ defaultValues: { name: '' } });
      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <input {...field} aria-label="empty-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    }

    render(<EmptyMessageFixture />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('useFormField throws without FormField context', () => {
    function Broken() {
      useFormField();
      return null;
    }

    function Wrapper() {
      const form = useForm({ defaultValues: { name: '' } });
      return (
        <Form {...form}>
          <Broken />
        </Form>
      );
    }

    expect(() => render(<Wrapper />)).toThrow(
      'useFormField should be used within <FormField>'
    );
  });

  test('useFormField throws without FormItem context', () => {
    function Wrapper() {
      const form = useForm({ defaultValues: { name: '' } });
      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="name"
              render={() => <FormLabel>Label</FormLabel>}
            />
          </form>
        </Form>
      );
    }

    expect(() => render(<Wrapper />)).toThrow(
      'useFormField should be used within <FormItem>'
    );
  });
});

describe('Field components', () => {
  test('renders field layouts and separators', () => {
    render(
      <FieldSet>
        <FieldLegend>Default Legend</FieldLegend>
        <FieldLegend variant="label">Legend</FieldLegend>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel>Label</FieldLabel>
            <FieldContent>
              <FieldTitle>Title</FieldTitle>
              <FieldDescription>Description</FieldDescription>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Default Field</FieldLabel>
          </Field>
          <Field orientation="responsive" />
        </FieldGroup>
        <FieldSeparator>Or</FieldSeparator>
      </FieldSet>
    );

    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Or')).toBeInTheDocument();
  });

  test('FieldError handles children and error arrays', () => {
    const { rerender } = render(
      <FieldError errors={undefined}>Child error</FieldError>
    );
    expect(screen.getByText('Child error')).toBeInTheDocument();

    rerender(<FieldError errors={[]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<FieldError errors={[{ message: 'One' }]} />);
    expect(screen.getByText('One')).toBeInTheDocument();

    rerender(
      <FieldError
        errors={[{ message: 'First' }, { message: 'Second' }, undefined]}
      />
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();

    rerender(<FieldError />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
