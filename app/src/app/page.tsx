'use client';

import { Header } from '@/components/analytics/header';
import { DashboardTabs } from '@/components/analytics/tabs/dashboard-tabs';
import { useAnalyticsDashboardData } from '@/hooks/use-analytics-dashboard-data';

export default function OUSAnalyticsDashboard() {
  const dashboard = useAnalyticsDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {dashboard.uploadedFile && (
        <div className="mx-6 mt-4 rounded-lg bg-chart-2/10 px-4 py-2 text-sm text-chart-2">
          Successfully loaded: {dashboard.uploadedFile}
        </div>
      )}

      <main className="p-6">
        <DashboardTabs
          dateLabel={dashboard.dateLabel}
          selectedDate={dashboard.selectedDate}
          onDateChange={dashboard.setSelectedDate}
          onUploadChange={dashboard.onUploadChange}
          breakdownOpen={dashboard.breakdownOpen}
          onBreakdownOpenChange={dashboard.setBreakdownOpen}
          snapshotTotals={dashboard.snapshotTotals}
          snapshotStudentTypes={dashboard.snapshotStudentTypes}
          snapshotSchools={dashboard.snapshotSchools}
          trendData={dashboard.trendData}
          majorData={dashboard.majorData}
          schoolData={dashboard.schoolData}
          cohortData={dashboard.cohortData}
          migrationData={dashboard.migrationData}
          migrationSemester={dashboard.migrationSemester}
          onMigrationSemesterChange={dashboard.setMigrationSemester}
          fiveYearGrowth={dashboard.fiveYearGrowth}
          forecastData={dashboard.forecastData}
        />
      </main>
    </div>
  );
}
