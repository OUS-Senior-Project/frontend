import { cn } from '@/lib/utils';

describe('cn', () => {
  test('merges class names and ignores falsy values', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  test('handles tailwind merges', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
