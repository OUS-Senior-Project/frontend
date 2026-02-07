import { render, screen } from '@testing-library/react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/shared/ui/input-otp';
import { OTPInputContext } from 'input-otp';

describe('InputOTP', () => {
  test('renders group, slot, and separator', () => {
    render(
      <InputOTP containerClassName="container" className="input">
        <InputOTPGroup>
          <OTPInputContext.Provider
            value={{
              slots: [
                { char: '1', hasFakeCaret: true, isActive: true },
                { char: '2', hasFakeCaret: false, isActive: false },
              ],
            }}
          >
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </OTPInputContext.Provider>
          <InputOTPSeparator />
        </InputOTPGroup>
      </InputOTP>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();

    render(
      <InputOTP>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>
    );
  });
});
