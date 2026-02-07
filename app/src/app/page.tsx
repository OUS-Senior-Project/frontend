'use client';

import React from 'react';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/analytics/header';
import { StatCard } from '@/components/analytics/stat-card';
import { AnalyticsTrendChart } from '@/components/analytics/analytics-trend-chart';
import { MajorBreakdownChart } from '@/components/analytics/major-breakdown-chart';
import { StudentTypeChart } from '@/components/analytics/student-type-chart';
import { SchoolBreakdownChart } from '@/components/analytics/school-breakdown-chart';
import { MigrationSankey } from '@/components/analytics/migration-sankey';
import { MigrationTable } from '@/components/analytics/migration-table';
import { ForecastSection } from '@/components/analytics/forecast-section';
import { DatePickerButton } from '@/components/analytics/date-picker-button';
import { AnalyticsBreakdownModal } from '@/components/analytics/analytics-breakdown-modal';
import { CohortSummaryTable } from '@/components/analytics/cohort-summary-table';
import {
  AvgGPAByMajorChart,
  AvgCreditsByMajorChart,
  AvgGPAByCohortChart,
  AvgCreditsByCohortChart,
} from '@/components/analytics/major-analytics-charts';
import { SemesterDropdown } from '@/components/analytics/semester-dropdown';
import {
  generateAnalyticsData,
  generateMigrationData,
  generateMajorCohortData,
  getYearlyAnalytics,
  getAnalyticsByMajor,
  getAnalyticsBySchool,
  getAnalyticsByStudentType,
  getTrendData,
  generateForecastData,
  getDailySnapshot,
  getSnapshotTotals,
} from '@/lib/analytics-data';
import { computeFiveYearGrowth, getTopMajorLabel } from '@/lib/analytics-utils';
import {
  Upload,
  Users,
  GraduationCap,
  TrendingUp,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OUSAnalyticsDashboard() {
  // Overview state: daily date picker
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  // Migration state: semester filter
  const [migrationSemester, setMigrationSemester] = useState<
    string | undefined
  >(undefined);

  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // Generate data
  const analyticsData = useMemo(() => generateAnalyticsData(), []);
  const migrationData = useMemo(() => generateMigrationData(), []);
  const cohortData = useMemo(() => generateMajorCohortData(), []);

  // Overview: daily snapshot
  const snapshotData = useMemo(
    () => getDailySnapshot(analyticsData, selectedDate),
    [analyticsData, selectedDate]
  );
  const snapshotTotals = useMemo(
    () => getSnapshotTotals(snapshotData),
    [snapshotData]
  );
  const snapshotStudentTypes = useMemo(
    () =>
      getAnalyticsByStudentType(snapshotData.map((r) => ({ ...r })) as any),
    [snapshotData]
  );
  const snapshotSchools = useMemo(
    () => getAnalyticsBySchool(snapshotData.map((r) => ({ ...r })) as any),
    [snapshotData]
  );

  // Overview: trend data (always full historical)
  const trendData = useMemo(
    () => getTrendData(analyticsData),
    [analyticsData]
  );

  // Majors tab: aggregated data
  const majorData = useMemo(
    () => getAnalyticsByMajor(analyticsData),
    [analyticsData]
  );
  const schoolData = useMemo(
    () => getAnalyticsBySchool(analyticsData),
    [analyticsData]
  );

  // Forecasts
  const forecastData = useMemo(
    () => generateForecastData(trendData),
    [trendData]
  );
  const yearlyAnalytics = useMemo(
    () => getYearlyAnalytics(analyticsData),
    [analyticsData]
  );

  // 5-year growth calculation
  const fiveYearGrowth = computeFiveYearGrowth(yearlyAnalytics);

  const totalMajors = majorData.length;
  const totalSchools = schoolData.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
      setSelectedDate(new Date());
    }
  };

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {uploadedFile && (
        <div className="mx-6 mt-4 rounded-lg bg-chart-2/10 px-4 py-2 text-sm text-chart-2">
          Successfully loaded: {uploadedFile}
        </div>
      )}

      <main className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="majors"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Majors
            </TabsTrigger>
            <TabsTrigger
              value="migration"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Migration
            </TabsTrigger>
            <TabsTrigger
              value="forecasts"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Forecasts
            </TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overview header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Overview
                </h2>
                <p className="text-sm text-muted-foreground">
                  Date: {dateLabel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="csv-upload">
                  <Button
                    variant="outline"
                    className="cursor-pointer bg-transparent"
                    asChild
                  >
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV
                    </span>
                  </Button>
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <DatePickerButton
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                />
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total Students"
                value={snapshotTotals.total}
                icon={Users}
                description="Current data date"
                onClick={() => setBreakdownOpen(true)}
              />
              <StatCard
                title="Active Majors"
                value={totalMajors}
                icon={GraduationCap}
                description="Across all schools"
              />
              <StatCard
                title="Schools/Colleges"
                value={totalSchools}
                icon={Building}
                description="Academic units"
              />
            </div>

            {/* Breakdown Modal */}
            <AnalyticsBreakdownModal
              open={breakdownOpen}
              onOpenChange={setBreakdownOpen}
              data={snapshotTotals}
              dateLabel={dateLabel}
            />

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <AnalyticsTrendChart data={trendData} />
              <StudentTypeChart data={snapshotStudentTypes} />
            </div>

            <SchoolBreakdownChart data={snapshotSchools} />
          </TabsContent>

          {/* ===== MAJORS TAB ===== */}
          <TabsContent value="majors" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Majors</h2>
              <p className="text-sm text-muted-foreground">
                Major-level analytics and cohort breakdowns
              </p>
            </div>

            {/* Top Majors Overview (moved from Overview) */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Top Major"
                value={getTopMajorLabel(majorData)}
                icon={GraduationCap}
                description={`${majorData[0]?.count.toLocaleString()} students`}
              />
              <StatCard
                title="Total Programs"
                value={totalMajors}
                icon={Building}
                description="Active majors"
              />
              <StatCard
                title="Avg per Major"
                value={Math.round(
                  majorData.reduce((sum, m) => sum + m.count, 0) /
                    majorData.length
                )}
                icon={Users}
                description="Students per major"
              />
            </div>

            <MajorBreakdownChart data={majorData} title="Top Majors Overview" />

            {/* 4 new analytics charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <AvgGPAByMajorChart data={cohortData} />
              <AvgCreditsByMajorChart data={cohortData} />
            </div>

            <AvgGPAByCohortChart data={cohortData} />
            <AvgCreditsByCohortChart data={cohortData} />

            {/* Cohort Summary Table */}
            <CohortSummaryTable data={cohortData} />
          </TabsContent>

          {/* ===== MIGRATION TAB ===== */}
          <TabsContent value="migration" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Major Migration Analysis
                </h2>
                <p className="text-sm text-muted-foreground">
                  Track student movement between majors by semester
                </p>
              </div>
              <SemesterDropdown
                value={migrationSemester}
                onValueChange={setMigrationSemester}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MigrationSankey
                  data={migrationData}
                  selectedSemester={migrationSemester}
                />
              </div>
              <MigrationTable
                data={migrationData}
                selectedSemester={migrationSemester}
              />
            </div>
          </TabsContent>

          {/* ===== FORECASTS TAB ===== */}
          <TabsContent value="forecasts" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Predictive Analytics
              </h2>
              <p className="text-sm text-muted-foreground">
                Student forecasts and data-driven insights
              </p>
            </div>

            {/* 5-Year Growth card (moved from Overview) */}
            <StatCard
              title="5-Year Growth"
              value={`+${fiveYearGrowth}%`}
              change={fiveYearGrowth}
              icon={TrendingUp}
              description="Since 2019"
            />

            <ForecastSection
              historicalData={trendData}
              forecastData={forecastData}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
