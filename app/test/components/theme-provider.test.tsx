import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/shared/components/ThemeProvider';

describe('ThemeProvider', () => {
  test('renders children', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <div>Child</div>
      </ThemeProvider>
    );

    expect(screen.getByText('Child')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
  });
});
