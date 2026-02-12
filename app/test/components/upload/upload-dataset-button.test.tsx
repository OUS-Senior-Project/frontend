import { fireEvent, render, screen } from '@testing-library/react';
import { UploadDatasetButton } from '@/features/upload/components/UploadDatasetButton';

describe('UploadDatasetButton', () => {
  test('renders default and custom button labels', () => {
    const onDatasetUpload = jest.fn();
    const { rerender } = render(
      <UploadDatasetButton onDatasetUpload={onDatasetUpload} />
    );
    expect(screen.getByLabelText('Upload Dataset')).toBeInTheDocument();

    rerender(
      <UploadDatasetButton
        onDatasetUpload={onDatasetUpload}
        buttonLabel="Upload dataset"
      />
    );
    expect(screen.getByLabelText('Upload dataset')).toBeInTheDocument();
  });

  test('ignores empty file selection', () => {
    const onDatasetUpload = jest.fn();
    render(<UploadDatasetButton onDatasetUpload={onDatasetUpload} />);

    const input = screen.getByLabelText('Upload Dataset') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [] },
    });

    expect(onDatasetUpload).not.toHaveBeenCalled();
  });

  test('calls upload callback and clears file input value when file exists', () => {
    const onDatasetUpload = jest.fn();
    render(<UploadDatasetButton onDatasetUpload={onDatasetUpload} />);

    const input = screen.getByLabelText('Upload Dataset') as HTMLInputElement;
    const file = new File(['id,name\n1,Jane'], 'dataset.csv', {
      type: 'text/csv',
    });

    fireEvent.change(input, {
      target: {
        files: [file],
      },
    });

    expect(onDatasetUpload).toHaveBeenCalledTimes(1);
    expect(onDatasetUpload).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
  });
});
