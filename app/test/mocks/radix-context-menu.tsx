import * as React from 'react';

type ComponentProps = React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode };

const createComponent = (Tag: keyof JSX.IntrinsicElements = 'div') =>
  React.forwardRef<HTMLElement, ComponentProps>(({ children, ...props }, ref) => {
    const {
      forceMount,
      onOpenChange,
      sideOffset,
      alignOffset,
      ...rest
    } = props as ComponentProps & {
      forceMount?: boolean;
      onOpenChange?: unknown;
      sideOffset?: number;
      alignOffset?: number;
    };
    return React.createElement(Tag, { ...rest, ref }, children);
  });

export const Root = createComponent('div');
export const Trigger = createComponent('div');
export const Group = createComponent('div');
export const Portal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const Sub = createComponent('div');
export const RadioGroup = createComponent('div');
export const SubTrigger = createComponent('div');
export const SubContent = createComponent('div');
export const Content = createComponent('div');
export const Item = createComponent('div');
export const CheckboxItem = createComponent('div');
export const RadioItem = createComponent('div');
export const Label = createComponent('div');
export const Separator = createComponent('div');
export const ItemIndicator = ({ children }: { children?: React.ReactNode }) => (
  <span>{children}</span>
);
