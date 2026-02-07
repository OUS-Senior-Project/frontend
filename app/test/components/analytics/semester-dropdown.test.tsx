import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <div
      data-testid="select"
      data-value={value}
      onClick={() => {
        onValueChange?.('all');
        onValueChange?.('Fall 2023');
      }}
    >
      {children}
    </div>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}));

import { SemesterDropdown } from '@/components/analytics/semester-dropdown';

describe('SemesterDropdown', () => {
  test('maps all to undefined and forwards selected semester', () => {
    const handleChange = jest.fn();
    render(<SemesterDropdown value={undefined} onValueChange={handleChange} />);

    fireEvent.click(screen.getByTestId('select'));

    expect(handleChange).toHaveBeenNthCalledWith(1, undefined);
    expect(handleChange).toHaveBeenNthCalledWith(2, 'Fall 2023');
  });
});
