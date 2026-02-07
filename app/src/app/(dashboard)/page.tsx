'use client';

import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardTabs } from '@/features/dashboard/components/DashboardTabs';
import { useDashboardMetricsModel } from '@/features/dashboard/hooks/useDashboardMetricsModel';
import { UploadStatusPanel } from '@/features/upload/components/UploadStatusPanel';

export default function DashboardPage() {
  const dashboard = useDashboardMetricsModel();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {dashboard.uploadedDatasetName && (
        <UploadStatusPanel uploadedDatasetName={dashboard.uploadedDatasetName} />
      )}

      <main className="p-6">
        <DashboardTabs
          dateLabel={dashboard.dateLabel}
          selectedDate={dashboard.selectedDate}
          onDateChange={dashboard.setSelectedDate}
          onDatasetUpload={dashboard.handleDatasetUpload}
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
