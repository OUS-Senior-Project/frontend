import { fireEvent, render, screen } from '@testing-library/react';
import { DashboardUploadFeedbackAlert } from '@/features/dashboard/components/DashboardUploadFeedback';
import type { DashboardUploadFeedback } from '@/features/dashboard/types/uploadFeedback';
import type { UIError } from '@/lib/api/types';

function makeFeedback(
  overrides: Partial<DashboardUploadFeedback> = {}
): DashboardUploadFeedback {
  return {
    phase: 'queued',
    fileName: 'dataset.csv',
    submissionStatus: 'queued',
    submissionId: 'sub-1',
    datasetId: 'ds-1',
    inferredEffectiveDate: '2026-02-11',
    inferredEffectiveDatetime: '2026-02-11T15:00:00Z',
    validationErrors: [],
    error: null,
    ...overrides,
  };
}

function renderAlert({
  uploadLoading = false,
  uploadError = null,
  uploadFeedback = null,
  uploadRetryAvailable = false,
  onRetryUpload = jest.fn(),
}: {
  uploadLoading?: boolean;
  uploadError?: UIError | null;
  uploadFeedback?: DashboardUploadFeedback | null;
  uploadRetryAvailable?: boolean;
  onRetryUpload?: () => void;
} = {}) {
  return {
    onRetryUpload,
    ...render(
      <DashboardUploadFeedbackAlert
        uploadLoading={uploadLoading}
        uploadError={uploadError}
        uploadFeedback={uploadFeedback}
        uploadRetryAvailable={uploadRetryAvailable}
        onRetryUpload={onRetryUpload}
      />
    ),
  };
}

describe('DashboardUploadFeedbackAlert', () => {
  test('renders nothing when no upload feedback is available', () => {
    const { container } = renderAlert();
    expect(container).toBeEmptyDOMElement();
  });

  test('renders lightweight loading and error fallback text when submission feedback is unavailable', () => {
    const { rerender } = render(
      <DashboardUploadFeedbackAlert
        uploadLoading={true}
        uploadError={null}
        uploadFeedback={null}
      />
    );

    expect(screen.getByText('Submitting dataset...')).toBeInTheDocument();

    rerender(
      <DashboardUploadFeedbackAlert
        uploadLoading={false}
        uploadError={{
          code: 'UPLOAD_FAILED',
          message: 'Backend not reachable',
          retryable: true,
        }}
        uploadFeedback={null}
      />
    );

    expect(screen.getByText('Backend not reachable')).toBeInTheDocument();
  });

  test('renders queued, processing, ready, and unknown phases with status/progress summaries', () => {
    const { rerender } = renderAlert({
      uploadLoading: true,
      uploadFeedback: makeFeedback({
        phase: 'queued',
        submissionStatus: 'queued',
        inferredEffectiveDate: null,
        error: null,
      }),
    });

    expect(screen.getByText('Upload queued')).toBeInTheDocument();
    expect(
      screen.getByText('Submission was created and is being polled for status updates.')
    ).toBeInTheDocument();
    expect(screen.getByText('Queued')).toBeInTheDocument();
    expect(screen.getByText('Stage-based upload progress: 20%.')).toBeInTheDocument();
    expect(screen.getByText('Inferring...')).toBeInTheDocument();

    rerender(
      <DashboardUploadFeedbackAlert
        uploadLoading={false}
        uploadError={null}
        uploadFeedback={makeFeedback({
          phase: 'processing',
          submissionStatus: 'processing',
          error: null,
        })}
      />
    );
    expect(screen.getByText('Upload processing')).toBeInTheDocument();
    expect(
      screen.getByText('Status was updated from the backend submission endpoint.')
    ).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Stage-based upload progress: 60%.')).toBeInTheDocument();

    rerender(
      <DashboardUploadFeedbackAlert
        uploadLoading={false}
        uploadError={null}
        uploadFeedback={makeFeedback({
          phase: 'ready',
          submissionStatus: 'completed',
          error: null,
        })}
      />
    );
    expect(screen.getByText('Upload ready')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The submission completed successfully and the dashboard will use the latest processed dataset.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Stage-based upload progress: 100%.')).toBeInTheDocument();

    rerender(
      <DashboardUploadFeedbackAlert
        uploadLoading={false}
        uploadError={null}
        uploadFeedback={
          makeFeedback({
            phase: 'unknown' as unknown as DashboardUploadFeedback['phase'],
            submissionStatus: null,
            fileName: '',
            submissionId: '',
            datasetId: '',
            inferredEffectiveDate: '',
            error: null,
          }) as DashboardUploadFeedback
        }
      />
    );
    expect(screen.getByText('Upload status')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Not available yet')).toBeInTheDocument();
    expect(screen.getByText('Not created')).toBeInTheDocument();
  });

  test('renders timeout guidance and retry button for failed uploads', () => {
    const onRetryUpload = jest.fn();
    renderAlert({
      uploadLoading: false,
      uploadRetryAvailable: true,
      onRetryUpload,
      uploadFeedback: makeFeedback({
        phase: 'failed',
        submissionStatus: 'processing',
        error: {
          code: 'SUBMISSION_POLL_TIMEOUT',
          message: 'Timed out waiting for submission.',
          retryable: true,
        },
      }),
    });

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(
      screen.getByText('The upload may still be processing on the backend.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Retry status checks or retry the upload if the failure persists.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry upload' }));
    expect(onRetryUpload).toHaveBeenCalledTimes(1);
  });

  test('renders generic retry guidance and all validation fallback labels', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        submissionStatus: 'failed',
        validationErrors: [{}, {}, {}, {}, {}, {}],
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Something else failed',
          retryable: true,
          status: 503,
        },
      }),
    });

    expect(
      screen.getByText(
        'Retry the upload. If it fails again, capture the error code and request ID for investigation.'
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^Validation error \d+$/)).toHaveLength(6);
    expect(
      screen.queryByText('Showing first 5 of 6 validation errors.')
    ).not.toBeInTheDocument();
  });

  test('does not render current-moment hint for generic validation failures without backend signal', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        validationErrors: [{ code: 'ROW_INVALID', message: 'Row 2 invalid.' }],
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed for uploaded file.',
          retryable: false,
          status: 422,
        },
      }),
    });

    expect(
      screen.getByText(
        'Fix the source file and upload again using the backend error code/message shown below.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Current Moment \(DateTime\)/)
    ).not.toBeInTheDocument();
  });

  test('does not render current-moment hint when validation error rows omit code/message fields', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        validationErrors: [{}],
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed for uploaded file.',
          retryable: false,
          status: 422,
        },
      }),
    });

    expect(
      screen.queryByText(/Current Moment \(DateTime\)/)
    ).not.toBeInTheDocument();
  });

  test('renders current-moment hint only when backend error message mentions Current Moment or DateTime', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        validationErrors: [{ code: 'ROW_INVALID', message: 'Row 2 invalid.' }],
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Current Moment (DateTime) values are inconsistent across rows.',
          retryable: false,
          status: 422,
        },
      }),
    });

    expect(
      screen.getByText(
        /If the error references Current Moment \(DateTime\), ensure every row has the same value/
      )
    ).toBeInTheDocument();
  });

  test('renders current-moment hint when backend validation details string mentions it and status drives validation handling', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        validationErrors: [{ code: 'ROW_INVALID', message: 'Row 2 invalid.' }],
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Validation failed.',
          retryable: false,
          status: 422,
          details: 'Current Moment (DateTime) values are inconsistent.',
        },
      }),
    });

    expect(
      screen.getByText(
        /If the error references Current Moment \(DateTime\), ensure every row has the same value/
      )
    ).toBeInTheDocument();
  });

  test('renders generic retry guidance for retryable errors without an HTTP status', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Network error',
          retryable: true,
        },
      }),
    });

    expect(
      screen.getByText(
        'Retry the upload. If it fails again, capture the error code and request ID for investigation.'
      )
    ).toBeInTheDocument();
  });

  test('renders conflict guidance fallback when effective date is unavailable', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        inferredEffectiveDate: null,
        submissionId: null,
        error: {
          code: 'UPLOAD_CONFLICT',
          message: 'Conflict',
          retryable: false,
          status: 409,
        },
      }),
    });

    expect(
      screen.getByText('An upload already exists for this effective date.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Open Admin Console' })
    ).toHaveAttribute('href', '/admin-console');
  });

  test('omits guidance for non-retryable non-special errors', () => {
    renderAlert({
      uploadFeedback: makeFeedback({
        phase: 'failed',
        error: {
          code: 'UNEXPECTED_FAILURE',
          message: 'No guidance path',
          retryable: false,
          status: 400,
        },
      }),
    });

    expect(screen.queryByText('Next steps')).not.toBeInTheDocument();
  });
});
