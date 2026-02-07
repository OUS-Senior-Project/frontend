'use client';

import React from 'react';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import type { MajorCohortRecord } from '@/lib/enrollment-data';
import { cohorts } from '@/lib/enrollment-data';

interface MajorAnalyticsChartsProps {
  data: MajorCohortRecord[];
}

const barColors = [
  'oklch(0.65 0.20 250)',
  'oklch(0.70 0.18 170)',
  'oklch(0.75 0.20 85)',
  'oklch(0.60 0.22 25)',
  'oklch(0.65 0.15 310)',
  'oklch(0.58 0.18 220)',
  'oklch(0.72 0.16 140)',
  'oklch(0.68 0.19 50)',
  'oklch(0.62 0.17 280)',
  'oklch(0.70 0.14 200)',
];

const cohortColors: Record<string, string> = {
  'FTIC 2021': 'oklch(0.65 0.20 250)',
  'FTIC 2022': 'oklch(0.70 0.18 170)',
  'FTIC 2023': 'oklch(0.75 0.20 85)',
  'FTIC 2024': 'oklch(0.60 0.22 25)',
};

const tooltipStyle = {
  backgroundColor: 'oklch(0.18 0.01 260)',
  border: '1px solid oklch(0.28 0.01 260)',
  borderRadius: '8px',
  color: 'oklch(0.95 0 0)',
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-foreground">
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Average GPA by Major (simple horizontal bar chart)
export function AvgGPAByMajorChart({ data }: MajorAnalyticsChartsProps) {
  const chartData = useMemo(() => {
    const majorMap: Record<string, { total: number; count: number }> = {};
    for (const d of data) {
      if (!majorMap[d.major]) majorMap[d.major] = { total: 0, count: 0 };
      majorMap[d.major].total += d.avgGPA * d.studentCount;
      majorMap[d.major].count += d.studentCount;
    }
    return Object.entries(majorMap)
      .map(([major, v]) => ({
        major,
        avgGPA: Math.round((v.total / v.count) * 100) / 100,
      }))
      .sort((a, b) => b.avgGPA - a.avgGPA);
  }, [data]);

  return (
    <ChartCard
      title="Average GPA by Major"
      subtitle="Weighted average across all cohorts"
    >
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.28 0.01 260)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 4]}
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <YAxis
              dataKey="major"
              type="category"
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [value.toFixed(2), 'Avg GPA']}
            />
            <Bar dataKey="avgGPA" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`gpa-cell-${index}`}
                  fill={barColors[index % barColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Average Credits Earned by Major (simple horizontal bar chart)
export function AvgCreditsByMajorChart({ data }: MajorAnalyticsChartsProps) {
  const chartData = useMemo(() => {
    const majorMap: Record<string, { total: number; count: number }> = {};
    for (const d of data) {
      if (!majorMap[d.major]) majorMap[d.major] = { total: 0, count: 0 };
      majorMap[d.major].total += d.avgCredits * d.studentCount;
      majorMap[d.major].count += d.studentCount;
    }
    return Object.entries(majorMap)
      .map(([major, v]) => ({
        major,
        avgCredits: Math.round(v.total / v.count),
      }))
      .sort((a, b) => b.avgCredits - a.avgCredits);
  }, [data]);

  return (
    <ChartCard
      title="Average Credits Earned by Major"
      subtitle="Weighted average across all cohorts"
    >
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.28 0.01 260)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <YAxis
              dataKey="major"
              type="category"
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [value, 'Avg Credits']}
            />
            <Bar dataKey="avgCredits" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`credit-cell-${index}`}
                  fill={barColors[index % barColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Average GPA by Major and FTIC Cohort (horizontal grouped bar chart)
export function AvgGPAByCohortChart({ data }: MajorAnalyticsChartsProps) {
  const chartData = useMemo(() => {
    const majorSet = new Set<string>();
    for (const d of data) majorSet.add(d.major);

    return Array.from(majorSet).map((major) => {
      const row: Record<string, string | number> = { major };
      for (const cohort of cohorts) {
        const match = data.find(
          (d) => d.major === major && d.cohort === cohort
        );
        row[cohort] = match ? match.avgGPA : 0;
      }
      return row;
    });
  }, [data]);

  const chartHeight = Math.max(500, chartData.length * 52);

  return (
    <ChartCard
      title="Average GPA by Major and FTIC Cohort"
      subtitle="Comparison across cohort years"
    >
      <div className="flex items-center gap-4 pb-3">
        {cohorts.map((cohort) => (
          <div key={cohort} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: cohortColors[cohort] }}
            />
            <span className="text-xs text-muted-foreground">{cohort}</span>
          </div>
        ))}
      </div>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.28 0.01 260)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 4]}
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <YAxis
              dataKey="major"
              type="category"
              tick={{ fill: 'oklch(0.85 0 0)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [
                value.toFixed(2),
                name,
              ]}
            />
            {cohorts.map((cohort) => (
              <Bar
                key={cohort}
                dataKey={cohort}
                fill={cohortColors[cohort]}
                radius={[0, 3, 3, 0]}
                barSize={10}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Average Credits Earned by Major and FTIC Cohort (horizontal grouped bar chart)
export function AvgCreditsByCohortChart({ data }: MajorAnalyticsChartsProps) {
  const chartData = useMemo(() => {
    const majorSet = new Set<string>();
    for (const d of data) majorSet.add(d.major);

    return Array.from(majorSet).map((major) => {
      const row: Record<string, string | number> = { major };
      for (const cohort of cohorts) {
        const match = data.find(
          (d) => d.major === major && d.cohort === cohort
        );
        row[cohort] = match ? match.avgCredits : 0;
      }
      return row;
    });
  }, [data]);

  const chartHeight = Math.max(500, chartData.length * 52);

  return (
    <ChartCard
      title="Average Credits Earned by Major and FTIC Cohort"
      subtitle="Comparison across cohort years"
    >
      <div className="flex items-center gap-4 pb-3">
        {cohorts.map((cohort) => (
          <div key={cohort} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: cohortColors[cohort] }}
            />
            <span className="text-xs text-muted-foreground">{cohort}</span>
          </div>
        ))}
      </div>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.28 0.01 260)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: 'oklch(0.65 0 0)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'oklch(0.28 0.01 260)' }}
            />
            <YAxis
              dataKey="major"
              type="category"
              tick={{ fill: 'oklch(0.85 0 0)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={150}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [value, name]}
            />
            {cohorts.map((cohort) => (
              <Bar
                key={cohort}
                dataKey={cohort}
                fill={cohortColors[cohort]}
                radius={[0, 3, 3, 0]}
                barSize={10}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
