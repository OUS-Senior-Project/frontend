import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders dashboard and upload panel', () => {
    render(<App />);

    expect(screen.getByText('Enrollment Dashboard')).toBeInTheDocument();
    expect(
      screen.getByText('Upload Workday Enrollment File')
    ).toBeInTheDocument();
    expect(screen.getByText('Enrollment Overview')).toBeInTheDocument();
  });
});
