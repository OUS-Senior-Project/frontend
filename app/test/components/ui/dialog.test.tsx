import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  test('renders content with close button by default', () => {
    render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <div>Portal</div>
        </DialogPortal>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog Description</DialogDescription>
          <DialogFooter>Footer</DialogFooter>
          <DialogClose>Close Dialog</DialogClose>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  test('can hide close button', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>No Close</DialogTitle>
          <DialogDescription>Hidden close button</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });
});
