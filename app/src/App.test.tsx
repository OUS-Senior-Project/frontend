import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { fetchItems } from './api/items';
import { summaryMetrics } from './constants';
import type { EnrollmentResponse } from './types';

jest.mock('./api/items');

const mockFetchItems = fetchItems as jest.MockedFunction<typeof fetchItems>;

const mockResponse: EnrollmentResponse = {
  summaryMetrics: [
    { title: 'Live Total Enrollment', value: '12,345' },
    { title: 'Live Undergraduate Students', value: '10,001' },
  ],
  majorSummaryData: [
    { major: 'Mock Major', avgGpa: 3.5, avgCredits: 50, studentCount: 99 },
  ],
  program_metrics: {
    by_class_and_program: {
      Freshman: {
        'Mock Major': {
          average_gpa: 3.5,
          average_credits: 50,
          student_count: 99,
        },
      },
    },
  },
};

describe('App', () => {
  beforeEach(() => {
    mockFetchItems.mockReset();
  });

  it('renders data returned from the API', async () => {
    mockFetchItems.mockResolvedValue(mockResponse);

    render(<App />);

    expect(await screen.findByText('Enrollment Dashboard')).toBeInTheDocument();
    await waitFor(() => expect(mockFetchItems).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText('Live Total Enrollment')
    ).toBeInTheDocument();
    expect(await screen.findByText('Mock Major')).toBeInTheDocument();
  });

  it('falls back to sample data when fetching fails', async () => {
    mockFetchItems.mockRejectedValue(new Error('network error'));

    render(<App />);

    expect(
      await screen.findByText(summaryMetrics[0].title)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Using sample data/, { exact: false })
    ).toBeInTheDocument();
  });
});
