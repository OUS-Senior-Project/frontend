import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('@/shared/ui/select', () => ({
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

import { SemesterFilterSelect } from '@/features/filters/components/SemesterFilterSelect';

describe('SemesterFilterSelect', () => {
  test('maps all to undefined and forwards selected semester', () => {
    const handleChange = jest.fn();
    render(<SemesterFilterSelect value={undefined} onValueChange={handleChange} />);

    fireEvent.click(screen.getByTestId('select'));

    expect(handleChange).toHaveBeenNthCalledWith(1, undefined);
    expect(handleChange).toHaveBeenNthCalledWith(2, 'Fall 2023');
  });
});
