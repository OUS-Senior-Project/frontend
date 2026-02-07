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

export const Root = createComponent('nav');
export const List = createComponent('ul');
export const Item = createComponent('li');
export const Trigger = createComponent('button');
export const Content = createComponent('div');
export const Viewport = createComponent('div');
export const Link = createComponent('a');
export const Indicator = createComponent('div');
