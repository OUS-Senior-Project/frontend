'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const DASHBOARD_DATE_QUERY_PARAM = 'date';
const ISO_DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDateParamValue(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate()
  )}`;
}

export function parseLocalDateFromDateParam(value: string) {
  if (!ISO_DATE_PARAM_PATTERN.test(value)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const day = Number(dayRaw);
  const parsed = new Date(year, monthIndex, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== monthIndex ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function normalizeDateParamValue(value: string | null) {
  if (!value) {
    return null;
  }

  return parseLocalDateFromDateParam(value) ? value : null;
}

type NavigationMode = 'push' | 'replace';

interface SetDateParamOptions {
  mode?: NavigationMode;
}

export function useDashboardDateParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawDateParam = searchParams.get(DASHBOARD_DATE_QUERY_PARAM);
  const dateParam = normalizeDateParamValue(rawDateParam);

  const setDateParam = useCallback(
    (value: string | null, options: SetDateParamOptions = {}) => {
      const mode = options.mode ?? 'push';
      const nextParams = new URLSearchParams(searchParams.toString());

      if (value) {
        nextParams.set(DASHBOARD_DATE_QUERY_PARAM, value);
      } else {
        nextParams.delete(DASHBOARD_DATE_QUERY_PARAM);
      }

      const nextQueryString = nextParams.toString();
      const nextHref = nextQueryString
        ? `${pathname}?${nextQueryString}`
        : pathname;
      const currentQueryString = searchParams.toString();
      const currentHref = currentQueryString
        ? `${pathname}?${currentQueryString}`
        : pathname;

      if (nextHref === currentHref) {
        return;
      }

      if (mode === 'replace') {
        router.replace(nextHref);
        return;
      }

      router.push(nextHref);
    },
    [pathname, router, searchParams]
  );

  return {
    rawDateParam,
    dateParam,
    setDateParam,
  };
}
