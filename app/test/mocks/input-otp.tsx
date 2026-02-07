import * as React from 'react';

type OTPInputProps = React.ComponentProps<'div'> & {
  containerClassName?: string;
};

export const OTPInputContext = React.createContext<any>(null);

export function OTPInput({ children, containerClassName, className, ...props }: OTPInputProps) {
  return (
    <div data-slot="otp-input" className={containerClassName} {...props}>
      <div data-slot="otp-input-inner" className={className} />
      {children}
    </div>
  );
}
