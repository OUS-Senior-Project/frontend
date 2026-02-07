import { render, screen, act } from '@testing-library/react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { toast } from '@/hooks/use-toast';
import { __setTheme } from 'next-themes';

describe('Toaster components', () => {
  test('renders toasts with and without title/description', () => {
    jest.useFakeTimers();
    const first = toast({ title: 'Toast Title', description: 'Toast Desc' });

    const { rerender } = render(<Toaster />);
    expect(screen.getByText('Toast Title')).toBeInTheDocument();
    expect(screen.getByText('Toast Desc')).toBeInTheDocument();

    act(() => {
      first.dismiss();
      jest.runAllTimers();
    });

    act(() => {
      toast({});
    });

    rerender(<Toaster />);
    expect(screen.queryByText('Toast Title')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  test('renders sonner toaster', () => {
    __setTheme(undefined);
    render(<SonnerToaster />);
    expect(screen.getByTestId('sonner')).toBeInTheDocument();
    __setTheme('light');
  });
});
