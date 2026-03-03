import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SAMPLE_TEMPLATE_HREF,
  UploadDatasetButton,
} from '@/features/upload/components/UploadDatasetButton';

describe('UploadDatasetButton', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders inline upload guidance and sample template link', () => {
    render(<UploadDatasetButton onDatasetUpload={jest.fn()} />);

    expect(
      screen.getByRole('button', { name: /Upload Dataset/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Accepted file types: .csv and .xlsx.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Required columns include: Current Moment \(DateTime\), Academic Level, Student Type\./
      )
    ).toBeInTheDocument();

    const templateLink = screen.getByRole('link', {
      name: 'Download sample upload template (.csv)',
    });
    expect(templateLink).toHaveAttribute('href', SAMPLE_TEMPLATE_HREF);
    expect(templateLink).toHaveAttribute('download');
  });

  test('renders default and custom button labels', () => {
    const onDatasetUpload = jest.fn();
    const { rerender } = render(
      <UploadDatasetButton onDatasetUpload={onDatasetUpload} />
    );
    expect(
      screen.getByRole('button', { name: 'Upload Dataset' })
    ).toBeInTheDocument();

    rerender(
      <UploadDatasetButton
        onDatasetUpload={onDatasetUpload}
        buttonLabel="Upload dataset"
      />
    );
    expect(
      screen.getByRole('button', { name: 'Upload dataset' })
    ).toBeInTheDocument();
  });

  test('clicking button triggers hidden file input click', () => {
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click');
    render(<UploadDatasetButton onDatasetUpload={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Upload Dataset' }));

    expect(clickSpy).toHaveBeenCalled();
  });

  test('keyboard Enter on focused upload button triggers hidden input click', async () => {
    const user = userEvent.setup();
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click');
    render(<UploadDatasetButton onDatasetUpload={jest.fn()} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Upload Dataset' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(clickSpy).toHaveBeenCalled();
  });

  test('ignores empty file selection', () => {
    const onDatasetUpload = jest.fn();
    render(<UploadDatasetButton onDatasetUpload={onDatasetUpload} />);

    const input = screen.getByLabelText('Upload Dataset', {
      selector: 'input[type="file"]',
    }) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    fireEvent.change(input, {
      target: { files: [] },
    });

    expect(onDatasetUpload).not.toHaveBeenCalled();
  });

  test('calls upload callback and clears file input value when file exists', () => {
    const onDatasetUpload = jest.fn();
    render(<UploadDatasetButton onDatasetUpload={onDatasetUpload} />);

    const input = screen.getByLabelText('Upload Dataset', {
      selector: 'input[type="file"]',
    }) as HTMLInputElement;
    expect(input).toBeInTheDocument();
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
