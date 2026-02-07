import * as React from 'react';

const renderChildren = (children: React.ReactNode) => {
  if (typeof children === 'function') {
    return (children as (args: { width: number; height: number }) => React.ReactNode)({
      width: 400,
      height: 300,
    });
  }
  return children;
};

const createComponent = (
  name: string,
  onRender?: (props: Record<string, unknown>) => void,
  tag: keyof JSX.IntrinsicElements = 'div'
) => {
  const Component = ({
    children,
    ...props
  }: Record<string, unknown> & { children?: React.ReactNode }) => {
    onRender?.(props as Record<string, unknown>);
    return React.createElement(
      tag,
      { 'data-recharts': name },
      renderChildren(children)
    );
  };
  Component.displayName = name;
  return Component;
};

export const ResponsiveContainer = createComponent('ResponsiveContainer');
export const LineChart = createComponent('LineChart', undefined, 'svg');
export const BarChart = createComponent('BarChart', undefined, 'svg');
export const PieChart = createComponent('PieChart', undefined, 'svg');
export const ComposedChart = createComponent('ComposedChart', undefined, 'svg');
export const CartesianGrid = createComponent('CartesianGrid', undefined, 'g');
export const ReferenceLine = createComponent('ReferenceLine', undefined, 'g');
export const Cell = createComponent('Cell', undefined, 'g');

export const XAxis = createComponent('XAxis', (props) => {
  const formatter = props.tickFormatter;
  if (typeof formatter === 'function') {
    formatter(1000);
  }
}, 'g');

export const YAxis = createComponent('YAxis', (props) => {
  const formatter = props.tickFormatter;
  if (typeof formatter === 'function') {
    formatter(1000);
  }
}, 'g');

export const Tooltip = createComponent('Tooltip', (props) => {
  const formatter = props.formatter;
  if (typeof formatter === 'function') {
    formatter(1234, 'total', { payload: { isForecasted: true } }, 0, {
      payload: { isForecasted: true },
    });
    formatter(987, 'other', { payload: { isForecasted: false } }, 1, {
      payload: { isForecasted: false },
    });
  }
  const labelFormatter = props.labelFormatter;
  if (typeof labelFormatter === 'function') {
    labelFormatter('Science', [{ name: 'A', value: 1 }]);
    labelFormatter('Unknown', [{ name: 'A', value: 1 }]);
  }
}, 'svg');

export const Legend = createComponent('Legend', (props) => {
  const formatter = props.formatter;
  if (typeof formatter === 'function') {
    formatter('Legend');
  }
}, 'svg');

export const Line = createComponent('Line', undefined, 'g');
export const Area = createComponent('Area', undefined, 'g');
export const Bar = createComponent('Bar', undefined, 'g');
export const Pie = createComponent('Pie', undefined, 'g');

export default {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  ComposedChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Area,
  Bar,
  Pie,
  Cell,
};
