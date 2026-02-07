import React from 'react';
import RootLayout, { metadata } from '@/app/layout';
import DashboardLayout from '@/app/(dashboard)/layout';
import { Analytics } from '@vercel/analytics/next';

describe('RootLayout', () => {
  test('renders children and analytics', () => {
    const element = RootLayout({
      children: <div>Child</div>,
    }) as React.ReactElement;

    expect(element.type).toBe('html');
    const body = element.props.children as React.ReactElement;
    expect(body.type).toBe('body');

    const bodyChildren = React.Children.toArray(body.props.children);
    const hasChild = bodyChildren.some(
      (child) =>
        React.isValidElement(child) && child.props.children === 'Child'
    );
    const hasAnalytics = bodyChildren.some(
      (child) => React.isValidElement(child) && child.type === Analytics
    );

    expect(hasChild).toBe(true);
    expect(hasAnalytics).toBe(true);
  });

  test('exports metadata', () => {
    expect(metadata.title).toBe('OUS Analytics');
    expect(metadata.description).toContain('Interactive student analytics');
  });

  test('DashboardLayout returns children untouched', () => {
    const element = DashboardLayout({
      children: <div>Dashboard Child</div>,
    }) as React.ReactElement;

    expect(React.isValidElement(element)).toBe(true);
    expect(React.isValidElement(element.props.children)).toBe(true);
    expect(element.props.children.props.children).toBe('Dashboard Child');
  });
});
