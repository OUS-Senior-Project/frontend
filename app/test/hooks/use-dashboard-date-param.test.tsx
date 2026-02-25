import { act, renderHook } from '@testing-library/react';
import {
  DASHBOARD_DATE_QUERY_PARAM,
  formatDateParamValue,
  normalizeDateParamValue,
  parseLocalDateFromDateParam,
  useDashboardDateParam,
} from '@/features/dashboard/hooks/useDashboardDateParam';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

let mockPathname = '/dashboard';
let mockSearchParamsString = '';

function setMockSearchParams(search: string) {
  mockSearchParamsString = search.startsWith('?') ? search.slice(1) : search;
}

function applyMockHref(href: string) {
  const [pathname, query = ''] = href.split('?');
  mockPathname = pathname;
  setMockSearchParams(query);
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearchParamsString),
}));

describe('useDashboardDateParam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/dashboard';
    setMockSearchParams('');
    mockRouter.push.mockImplementation((href: string) => {
      applyMockHref(href);
    });
    mockRouter.replace.mockImplementation((href: string) => {
      applyMockHref(href);
    });
  });

  test('formats and parses local date params safely', () => {
    expect(DASHBOARD_DATE_QUERY_PARAM).toBe('date');
    expect(formatDateParamValue(new Date(2026, 2, 1))).toBe('2026-03-01');

    const parsed = parseLocalDateFromDateParam('2026-03-01');
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(2);
    expect(parsed?.getDate()).toBe(1);

    expect(parseLocalDateFromDateParam('2026/03/01')).toBeNull();
    expect(parseLocalDateFromDateParam('2026-02-31')).toBeNull();
    expect(normalizeDateParamValue(null)).toBeNull();
    expect(normalizeDateParamValue('')).toBeNull();
    expect(normalizeDateParamValue('2026-03-01')).toBe('2026-03-01');
    expect(normalizeDateParamValue('2026-02-31')).toBeNull();
  });

  test('reads current date param and pushes updates while preserving other params', () => {
    setMockSearchParams('foo=bar&date=2026-02-11');
    const { result, rerender } = renderHook(() => useDashboardDateParam());

    expect(result.current.rawDateParam).toBe('2026-02-11');
    expect(result.current.dateParam).toBe('2026-02-11');

    act(() => {
      result.current.setDateParam('2026-03-01');
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard?foo=bar&date=2026-03-01');
    rerender();
    expect(result.current.rawDateParam).toBe('2026-03-01');
  });

  test('supports replace mode and deleting the date param', () => {
    setMockSearchParams('date=2026-02-11&foo=bar');
    const { result } = renderHook(() => useDashboardDateParam());

    act(() => {
      result.current.setDateParam(null, { mode: 'replace' });
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard?foo=bar');
  });

  test('builds pathname-only href when removing the only date param', () => {
    setMockSearchParams('date=2026-02-11');
    const { result } = renderHook(() => useDashboardDateParam());

    act(() => {
      result.current.setDateParam(null, { mode: 'replace' });
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
  });

  test('pushes from an empty query string to a date-only href', () => {
    const { result } = renderHook(() => useDashboardDateParam());

    act(() => {
      result.current.setDateParam('2026-03-01');
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard?date=2026-03-01');
  });

  test('skips navigation when the next href matches the current href', () => {
    setMockSearchParams('date=2026-02-11');
    const { result } = renderHook(() => useDashboardDateParam());

    act(() => {
      result.current.setDateParam('2026-02-11');
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
